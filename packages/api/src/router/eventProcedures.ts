// lib/trpc/router.ts
import { db, eq, eventSchema, eventTable } from '@matterloop/db'
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
	upsert: procedureWithContext
		// .use(verifyMe())
		.use(verifyEvent())
		.input(eventSchema)
		.mutation(async ({ ctx, input }) => {
			if (input.id) {
				await db
					.update(eventTable)
					.set(pick(input, ['name', 'description', 'type', 'eventId', 'startsAt']))
					.where(eq(eventTable.id, input.id))
					.returning()
				const updated = await db.select().from(eventTable).where(eq(eventTable.id, input.id))
				return updated[0]
			} else {
				input.eventId = ctx.event.id
				const newForm = await db
					.insert(eventTable)
					.values(pick(input, ['name', 'description', 'type', 'eventId', 'startsAt']))
					.returning()
				return newForm[0]
			}
		}),
})
