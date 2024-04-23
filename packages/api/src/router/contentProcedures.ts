// lib/trpc/router.ts
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	contentSchema,
	contentTable,
	db,
	eq,
	eventSchema,
	eventTable,
	EventUser,
	eventUserTable,
	upsertEventUserSchema,
	userSchema,
	venueSchema,
	venueTable,
} from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { omit, pick } from '@matterloop/util'

import { redis } from '../core/redis'
import {
	procedureWithContext,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const contentProcedures = t.router({
	upsert: procedureWithContext
		// .use(verifyMe())
		.use(verifyEvent())
		.input(contentSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			if (id) {
				await db.update(contentTable).set(data).where(eq(contentTable.id, id))
				const content = await db.query.contentTable.findFirst({
					where: and(eq(contentTable.id, id)),
				})
				redis.expire(`event_heavy:${ctx.event.id}`, 0)
				return content
			} else {
				const contentRows = await db
					.insert(contentTable)
					.values({ ...data, eventId: ctx.event.id, status: 'published' })
					.returning()
				redis.expire(`event_heavy:${ctx.event.id}`, 0)
				return contentRows[0]
			}
		}),
})
