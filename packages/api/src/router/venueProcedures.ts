// lib/trpc/router.ts
import { db, eq, eventSchema, ilike, or, venueTable, venueSchema, venueTable, and } from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { pick } from '@matterloop/util'
import { TRPCError, initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	procedureWithContext,
	verifyAdmin,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'
import { getGeoCodedAddress } from '../util/getGeocodedAddress'
import { redis } from '../core/redis'

const t = initTRPC.context<TrpcContext>().create()
export const venueProcedures = t.router({
	search: procedureWithContext
		.use(verifyEvent())
		.input(z.object({ q: z.string() }))
		.query(async ({ ctx, input }) => {
			const venues = await db.query.venueTable.findMany({
				where: and(
					eq(venueTable.eventId, ctx.event.id),
					or(
						ilike(venueTable.name, `%${input.q}%`),
						ilike(venueTable.description, `%${input.q}%`),
						ilike(venueTable.address, `%${input.q}%`),
					),
				),
				with: { photo: true },
				limit: 10,
			})
			return venues
		}),
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
	upsert: procedureWithContext
		// .use(verifyMe())
		.use(verifyEvent())
		.input(venueSchema)
		.mutation(async ({ ctx, input }) => {
				const { id, ...data} = input
			if (input.id) {
				let geo = {}
				const existing = await db.query.venueTable.findFirst({
					where: and(eq(venueTable.id, input.id), eq(venueTable.eventId, ctx.event.id)),
				})
				if (input.address && input?.address !== existing?.address) {
					geo = await getGeoCodedAddress(input.address)
				}
				await db
					.update(venueTable)
					.set({...pick(input, ['name', 'description', 'type', 'eventId', 'address', 'mediaId', 'venueId', 'visibleOnMainList']), ...geo})
					.where(eq(venueTable.id, input.id))
					.returning()
				const updated = await db.select().from(venueTable).where(eq(venueTable.id, input.id))
				redis.del(`event_heavy:${ctx.event.id}`)
				return updated[0]
			} else {
				input.eventId = ctx.event.id
				const newForm = await db
					.insert(venueTable)
					.values(pick(input, ['name', 'description', 'type', 'eventId', 'address', 'mediaId', 'venueId']))
					.returning()
				redis.del(`event_heavy:${ctx.event.id}`)
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
						const existing = await db.query.venueTable.findFirst({
							where: and(eq(venueTable.id, change.id), eq(venueTable.eventId, ctx.event.id)),
						})

						if (!existing)
							throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Venue not found' })
				redis.del(`event_heavy:${ctx.event.id}`)
						return db
							.update(venueTable)
							.set({ ord: change.ord })
							.where(eq(venueTable.id, change.id))
					}),
				)
				return true
			} catch (e) {
				return false
			}
		}),
})
