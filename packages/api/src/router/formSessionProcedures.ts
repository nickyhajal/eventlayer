import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	db,
	eq,
	eventUserInfoTable,
	FormElement,
	formElementTable,
	formResponseStatTable,
	formResponseTable,
	formSessionTable,
	gte,
	inArray,
	userTable,
	type FormResponse,
	type FormSession,
} from '@matterloop/db'
import { byKey, dayjs, makeCleanNumber } from '@matterloop/util'

import { NotAuthdError } from '../core/Errors'
import { procedureWithContext, verifyMe, type TrpcContext } from '../procedureWithContext'

// import { NotAuthdError } from '$lib/server/core/Errors'

const t = initTRPC.context<TrpcContext>().create()

const setNameSchema = z.object({
	id: z.string(),
	name: z.string(),
})

const sessionSchema = z.object({
	formId: z.string(),
	companyId: z.string(),
})
const submitSchema = z.object({
	formId: z.string().optional(),
	companyId: z.string().optional(),
	companyUserFormId: z.string().optional(),
	sessionId: z.string().optional(),
	submissionDate: z.string().optional(),
	responses: z.array(z.object({ id: z.string(), value: z.string() })),
})

export const formSessionProcedures = t.router({
	create: procedureWithContext.input(setNameSchema).mutation(async ({ ctx, input }) => {
		const created = await db.insert(formSessionTable).values(input).returning()
		return created
	}),
	markSubmitted: procedureWithContext
		.input(z.object({ sessionId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const { sessionId } = input
			if (!ctx?.me?.id && !sessionId) {
				throw NotAuthdError()
			}
			if (!sessionId) {
				throw new Error('No session')
			}
			const session = await db.query.formSessionTable.findFirst({
				where: eq(formSessionTable.id, sessionId),
			})
			if (!session) {
				throw new Error('No session')
			}
			if (session.status !== 'submitted') {
				const row = await db
					.update(formSessionTable)
					.set({
						status: 'submitted',
						updatedAt: dayjs().toISOString(),
						submissionDate: session.submissionDate || session.due || dayjs().format('YYYY-MM-DD'),
					})
					.where(eq(formSessionTable.id, sessionId))
					.returning()
				return row
			}
		}),
	submit: procedureWithContext.input(submitSchema).mutation(async ({ ctx, input }) => {
		const { formId, sessionId, responses, submissionDate } = input
		if (!ctx?.me?.id && !sessionId) {
			throw NotAuthdError()
		}
		let userId: string = ctx.me.id
		let editing = false
		let session: FormSession | false = false
		let eventId = ctx.event.id
		let key = `${formId}-${userId}`

		console.time(key)
		// If we don't have a session, create it and submit
		if (!sessionId) {
			console.timeLog(key, 'check sess')
			// userId = ctx.me.id
			const inserted = await db
				.insert(formSessionTable)
				.values({
					status: 'submitted',
					eventId,
					formId,
					userId,
					submissionDate: submissionDate || dayjs().format('YYYY-MM-DD'),
				})
				.returning()
			console.timeLog(key, 'make sess')
			if (inserted?.[0]) {
				session = inserted[0]
			}

			// If we do have a session go from there
		} else {
			console.timeLog(key, 'get sess')
			const existing = await db.query.formSessionTable.findFirst({
				where: eq(formSessionTable.id, sessionId),
			})
			if (existing && existing.userId) {
				userId = existing.userId
				session = existing
				if (existing.status === 'submitted') {
					editing = true
				}
				console.timeLog(key, 'upd sess')
				await db
					.update(formSessionTable)
					.set({
						submissionDate: existing.submissionDate || existing.due || dayjs().format('YYYY-MM-DD'),
						updatedAt: dayjs().toISOString(),
						status: 'submitted',
					})
					.where(eq(formSessionTable.id, session.id))
			}
			console.timeLog(key, 'done up sess')
		}

		// If we have a session, proceed
		if (session !== false) {
			const { formId, id: sessionId } = session

			// Get the elements related to each sent response
			console.timeLog(key, 'responses, get elms')
			const elements = responses?.length
				? await db.query.formElementTable.findMany({
						where: inArray(
							formElementTable.id,
							responses.map(({ id }) => id),
						),
					})
				: []
			const elementsById = byKey('id', elements)
			const needsUserSync: FormElement[] = []
			console.timeLog(key, 'check sync')
			const values = responses.map(({ id: elementId, value }) => {
				const element = elementsById?.[elementId]
				if (element?.userInfoKey) {
					needsUserSync.push(element)
				}
				return {
					userId,
					formId,
					elementId,
					value: ['metric', 'number'].includes(element?.type || '')
						? makeCleanNumber(value)
						: value,
					sessionId,
				}
			})
			let rows: FormResponse[] = []
			console.timeLog(key, 'do rsp update')
			if (editing) {
				await Promise.all(
					values.map(async (update) => {
						const existing = await db.query.formResponseTable.findFirst({
							where: and(
								eq(formResponseTable.sessionId, sessionId),
								eq(formResponseTable.elementId, update.elementId),
							),
						})
						if (!existing) {
							return db.insert(formResponseTable).values(update)
						} else if (update.value !== existing.value) {
							return db
								.update(formResponseTable)
								.set({ value: update.value })
								.where(
									and(
										eq(formResponseTable.sessionId, sessionId),
										eq(formResponseTable.elementId, update.elementId),
									),
								)
						}
					}),
				)
			} else {
				rows = await db.insert(formResponseTable).values(values).returning()
			}
			console.timeLog(key, 'rsp update done')

			// Sync to user values
			console.timeLog(key, 'user sync done', needsUserSync.length)
			if (needsUserSync.length) {
				await Promise.all(
					needsUserSync.map(async (element) => {
						const { userInfoKey, userInfoPublic } = element
						if (!userInfoKey) return
						const response = values.find(({ elementId }) => elementId === element.id)
						if (!response) return
						if (['firstName', 'lastName'].includes(userInfoKey)) {
							await db
								.update(userTable)
								.set({ [userInfoKey]: response.value })
								.where(eq(userTable.id, userId))
						} else {
							const existing = await db.query.eventUserInfoTable.findFirst({
								where: and(
									eq(eventUserInfoTable.eventId, eventId),
									eq(eventUserInfoTable.userId, userId),
									eq(eventUserInfoTable.key, userInfoKey),
								),
							})
							if (existing) {
								await db
									.update(eventUserInfoTable)
									.set({ value: response.value || '' })
									.where(eq(eventUserInfoTable.id, existing.id))
							} else {
								await db.insert(eventUserInfoTable).values({
									type: 'info',
									key: userInfoKey,
									value: response.value,
									public: userInfoPublic,
									userId,
									eventId,
								})
							}
						}
					}),
				)
			}
			console.timeLog(key, 'user sync done')
			console.timeEnd(key)
			return rows
		}
	}),
	submitEditor: procedureWithContext
		.input(
			submitSchema.extend({
				editing: z.boolean().default(true),
				status: z.string().default('active'),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { companyId, sessionId, editing, responses, status } = input
			if (!ctx?.me?.id && !sessionId) {
				throw NotAuthdError()
			}
			let userId: string
			let session: FormSession | false = false

			// We must have a session to continue
			if (!sessionId) {
				throw new Error('No session')
			} else {
				const existing = await db.query.formSessionTable.findFirst({
					where: eq(formSessionTable.id, sessionId),
				})
				if (existing && existing.userId) {
					userId = existing.userId
					session = existing
					await db
						.update(formSessionTable)
						.set({
							status,
							updatedAt: dayjs().toISOString(),
						})
						.where(eq(formSessionTable.id, session.id))
					assignFormSessions()
				}
			}
			if (session !== false) {
				const { formId, id: sessionId } = session
				const elements = await db.query.formElementTable.findMany({
					where: inArray(
						formElementTable.id,
						responses.map(({ id }) => id),
					),
				})
				const elementsById = byKey('id', elements)
				const values = responses.map(({ id: elementId, value }) => ({
					userId,
					companyId,
					formId,
					elementId,
					value: ['marker', 'metric', 'markerBlock', 'number'].includes(
						elementsById?.[elementId]?.type || '',
					)
						? makeCleanNumber(value)
						: value,
					sessionId,
				}))
				let rows: FormResponse[] = []
				if (editing) {
					await Promise.all(
						values.map(async (update) => {
							const existing = await db.query.formResponseTable.findFirst({
								where: and(
									eq(formResponseTable.sessionId, sessionId),
									eq(formResponseTable.elementId, update.elementId),
								),
							})
							if (!existing) {
								return db.insert(formResponseTable).values(update)
							} else {
								return db
									.update(formResponseTable)
									.set({ value: update.value })
									.where(
										and(
											eq(formResponseTable.sessionId, sessionId),
											eq(formResponseTable.elementId, update.elementId),
										),
									)
							}
						}),
					)
				} else {
					rows = await db.insert(formResponseTable).values(values).returning()
				}
				const statrows = await db
					.select()
					.from(formResponseStatTable)
					.leftJoin(formResponseTable, eq(formResponseTable.id, formResponseStatTable.responseId))
					.where(
						and(
							eq(formResponseTable.sessionId, sessionId),
							gte(formResponseStatTable.createdAt, session.createdAt || '1970-01-01'),
						),
					)
				const statIds = statrows.map(({ form_response_stat }) => form_response_stat.id)
				if (statIds.length) {
					await db.delete(formResponseStatTable).where(inArray(formResponseStatTable.id, statIds))
				}
				return rows
			}
		}),
})
