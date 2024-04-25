// lib/trpc/router.ts
import crypto from 'crypto'
import { error } from '@sveltejs/kit'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	AttendeeStore,
	db,
	eq,
	Event,
	eventSchema,
	eventTable,
	eventUserTable,
} from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { dayjs, pick } from '@matterloop/util'

import { redis } from '../core/redis'
import { EventFns } from '../models/eventFns'
import {
	procedureWithContext,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'

async function getAttendeeStore(event: Event) {
	if (!event?.id) return false
	let store = await redis.get(`${event.id}_attendeeStore`)
	const attendees = await EventFns({ eventId: event.id }).getUsers()
	const simpleAttendees = attendees.map(({ id, firstName, type, lastName, email, photo }) => ({
		id,
		photo,
		firstName,
		type,
		email,
		lastName,
	}))
	const hash = crypto.createHash('md5').update(JSON.stringify(simpleAttendees)).digest('hex')
	const newStore = {
		attendees: attendees,
		num: attendees.length,
		hash,
		lastUpdate: dayjs().toISOString(),
	}
	redis.set(`${event.id}_attendeeStore`, newStore)
	redis.expire(`${event.id}_attendeeStore`, 5000)
	return newStore
}

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
	getAttendeeStore: procedureWithContext
		.input(
			z.object({
				hash: z.string(),
				lastUpdate: z.string(),
				num: z.number(),
			}),
		)
		.query(async ({ input, ctx }) => {
			const store = await getAttendeeStore(ctx.event)
			if (store && store.hash && store.hash !== input.hash) {
				return store
			}
			return false
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
			//redis.expire(`event_heavy:${input.eventId}`, 0)
			//redis.expire(`event_users:${input.eventId}`, 0)
			//redis.expire(`event_usersWithInfo:${input.eventId}`, 0)
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
			if (existing) {
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
							'colors',
							'ord',
							'mediaId',
							'faviconId',
							'replyEmail',
							'emailFromName',
							'largeLogoId',
							'venueId',
						]),
					)
					.where(eq(eventTable.id, input.id))
					.returning()
				const updated = await db.select().from(eventTable).where(eq(eventTable.id, input.id))
				console.log(`update event_heavy:${input.id}`)
				redis.del(`event_heavy:${input.id}`)
				return updated[0]
			} else {
				const createInput = eventSchema.parse(input)
				createInput.eventId = ctx.event.id
				const newForm = await db
					.insert(eventTable)
					.values(
						pick(createInput, [
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
				console.log(`create event_heavy:${newForm.id}`)
				redis.del(`event_heavy:${newForm.id}`)

				return newForm[0]
			}
		}),
})
