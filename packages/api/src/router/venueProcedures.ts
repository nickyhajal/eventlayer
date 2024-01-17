// lib/trpc/router.ts
import { db, eq, eventSchema, venueTable, venueSchema, venueTable } from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { pick } from '@matterloop/util'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	procedureWithContext,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'
import { getGeoCodedAddress } from '../util/getGeocodedAddress'

const t = initTRPC.context<TrpcContext>().create()
export const venueProcedures = t.router({
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
				if (input.address) {
					geo = await getGeoCodedAddress(input.address)
				}
				await db
					.update(venueTable)
					.set({...pick(input, ['name', 'description', 'type', 'eventId', 'address', 'mediaId']), ...geo})
					.where(eq(venueTable.id, input.id))
					.returning()
				const updated = await db.select().from(venueTable).where(eq(venueTable.id, input.id))
				return updated[0]
			} else {
				input.eventId = ctx.event.id
				const newForm = await db
					.insert(venueTable)
					.values(pick(input, ['name', 'description', 'type', 'eventId', 'address', 'mediaId']))
					.returning()
				return newForm[0]
			}
		}),
})
