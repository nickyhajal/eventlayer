// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	db,
	eq,
	eventSchema,
	eventUserTable,
	sponsorSchema,
	sponsorTable,
} from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { pick } from '@matterloop/util'

import {
	procedureWithContext,
	verifyAdmin,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const sponsorProcedures = t.router({
	get: procedureWithContext
		.input(
			z
				.object({
					day: z.string().optional(),
				})
				.optional(),
		)
		.query(async ({ ctx }) => {
			if (!ctx.meId) {
				return null
			}
			const user = ctx.me
			if (!user || !ctx.me) {
				return null
			}
			return db.query.userTable.findFirst({
				where: eq(userTable.id, ctx.meId),
				with: {},
			})
		}),
	addRep: procedureWithContext
		.input(z.object({ sponsorId: z.string(), eventUserId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const existing = await db
					.select()
					.from(eventUserTable)
					.where(eq(eventUserTable.id, input.eventUserId))
				if (!existing) {
					return error(404, 'User not in event')
				}
				await db
					.update(eventUserTable)
					.set({ sponsorId: input.sponsorId })
					.where(eq(eventUserTable.id, input.eventUserId))
			} catch (e) {
				return {}
			}
		}),
	removeRep: procedureWithContext
		.input(z.object({ eventUserId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			console.log(input)
			try {
				await db
					.update(eventUserTable)
					.set({ sponsorId: null })
					.where(eq(eventUserTable.id, input.eventUserId))
			} catch (e) {
				return {}
			}
		}),
	upsert: procedureWithContext
		// .use(verifyMe())
		.use(verifyEvent())
		.input(sponsorSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			if (input.id) {
				await db
					.update(sponsorTable)
					.set({
						...pick(input, [
							'title',
							'description',
							'url',
							'bookingUrl',
							'type',
							'eventId',
							'mediaId',
						]),
					})
					.where(eq(sponsorTable.id, input.id))
					.returning()
				const updated = await db.select().from(sponsorTable).where(eq(sponsorTable.id, input.id))
				return updated[0]
			} else {
				input.eventId = ctx.event.id
				const newForm = await db
					.insert(sponsorTable)
					.values(
						pick(input, [
							'title',
							'description',
							'url',
							'bookingUrl',
							'type',
							'eventId',
							'mediaId',
						]),
					)
					.returning()
				return newForm[0]
			}
		}),
	order: procedureWithContext
		.use(verifyMe())
		.use(verifyEvent())
		.use(verifyAdmin())
		.input(
			z.object({
				changes: z.array(
					z.object({
						id: z.string(),
						ord: z.number(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				await Promise.all(
					input.changes.map(async (change) => {
						const existing = await db.query.sponsorTable.findFirst({
							where: and(eq(sponsorTable.id, change.id), eq(sponsorTable.eventId, ctx.event.id)),
						})

						if (!existing)
							throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Sponsor not found' })
						return db
							.update(sponsorTable)
							.set({ ord: change.ord })
							.where(eq(sponsorTable.id, change.id))
					}),
				)
				return true
			} catch (e) {
				return false
			}
		}),
})
