import { initTRPC } from '@trpc/server'
import { procedureWithContext, type TrpcContext, verifyMe } from '../procedureWithContext'
import { z } from 'zod'
import { and, eq, gte, inArray } from '@matterloop/db'
import {
	db,
	formSessionTable,
	type FormSession,
	formResponseTable,
	formElementTable,
	type FormResponse,
	formResponseStatTable,
} from '@matterloop/db'
import { byKey, dayjs, makeCleanNumber } from '@matterloop/util'
import { NotAuthdError } from '../core/Errors'
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
	submitReport: procedureWithContext.input(submitSchema).mutation(async ({ ctx, input }) => {
		const { formId, companyId, sessionId, responses, submissionDate, companyUserFormId } = input
		if (!ctx?.me?.id && !sessionId) {
			throw NotAuthdError()
		}
		let userId: string = ctx.me.id
		let editing = false
		let session: FormSession | false = false
		let eventId = ctx.event.id

		// If we don't have a session, create it and submit
		if (!sessionId) {
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
			if (inserted?.[0]) {
				session = inserted[0]
			}

			// If we do have a session go from there
		} else {
			const existing = await db.query.formSessionTable.findFirst({
				where: eq(formSessionTable.id, sessionId),
			})
			if (existing && existing.userId) {
				userId = existing.userId
				session = existing
				if (existing.status === 'submitted') {
					editing = true
				}
				await db
					.update(formSessionTable)
					.set({
						submissionDate: existing.submissionDate || existing.due || dayjs().format('YYYY-MM-DD'),
						updatedAt: dayjs().toISOString(),
						status: 'submitted',
					})
					.where(eq(formSessionTable.id, session.id))
			}
		}
		if (session !== false) {
			const { formId, id: sessionId } = session
			const elements = responses?.length
				? await db.query.formElementTable.findMany({
						where: inArray(
							formElementTable.id,
							responses.map(({ id }) => id),
						),
				  })
				: []
			const elementsById = byKey('id', elements)
			const values = responses.map(({ id: elementId, value }) => ({
				userId,
				companyId,
				formId,
				elementId,
				value: [ 'metric',  'number'].includes(
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
