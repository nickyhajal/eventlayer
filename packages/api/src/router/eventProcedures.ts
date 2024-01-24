// lib/trpc/router.ts
import { and, db, eq, eventSchema, eventTable, eventUserTable } from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { pick } from '@matterloop/util'
import { error } from '@sveltejs/kit'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	procedureWithContext,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const eventProcedures = t.router({
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
	addUser: procedureWithContext
		.input(z.object({ userId: z.string(), eventId: z.string(), type: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const event = await db.query.eventTable.findFirst({
				where: and(eq(eventTable.id, input.eventId), eq(eventTable.eventId, ctx.event?.id)),
			})
			if (!event) return error(404, 'Event not found')
			const existing = await db.query.eventUserTable.findFirst({
				where: and(
					eq(eventUserTable.userId, input.userId),
					eq(eventUserTable.eventId, input.eventId),
				),
			})
			if (existing) {
				await db
					.update(eventUserTable)
					.set({ type: input.type })
					.where(eq(eventUserTable.id, existing.id))
			} else {
				await db
					.insert(eventUserTable)
					.values({ ...input })
					.returning()
			}
			return true
		}),
	removeUser: procedureWithContext
		.input(z.object({ userId: z.string(), eventId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const event = await db.query.eventTable.findFirst({
				where: and(eq(eventTable.id, input.eventId), eq(eventTable.eventId, ctx.event?.id)),
			})
			console.log(1)
			if (!event) return error(404, 'Event not found')
			const existing = await db.query.eventUserTable.findFirst({
				where: and(
					eq(eventUserTable.userId, input.userId),
					eq(eventUserTable.eventId, input.eventId),
				),
			})
			console.log(2)
			if (existing) {
				console.log(3, existing.id)
				await db.delete(eventUserTable).where(eq(eventUserTable.id, existing.id))
			}
			return true
		}),
	upsert: procedureWithContext
		// .use(verifyMe())
		.use(verifyEvent())
		.input(eventSchema.partial())
		.mutation(async ({ ctx, input }) => {
			if (input.id) {
				await db
					.update(eventTable)
					.set(
						pick(input, [
							'name',
							'subtitle',
							'description',
							'type',
							'eventId',
							'startsAt',
							'mediaId',
							'venueId',
						]),
					)
					.where(eq(eventTable.id, input.id))
					.returning()
				const updated = await db.select().from(eventTable).where(eq(eventTable.id, input.id))
				return updated[0]
			} else {
				input.eventId = ctx.event.id
				const newForm = await db
					.insert(eventTable)
					.values(
						pick(input, [
							'name',
							'subtitle',
							'description',
							'type',
							'eventId',
							'startsAt',
							'venueId',
						]),
					)
					.returning()
				return newForm[0]
			}
		}),
})
