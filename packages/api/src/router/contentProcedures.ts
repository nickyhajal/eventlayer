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
  delete: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input
      if (id) {
        await db.delete(contentTable).where(eq(contentTable.id, id))
        redis.del(`event_heavy:${ctx.event.id}`)
        return true
      }
    }),
  upsert: procedureWithContext
    // .use(verifyMe())
    .use(verifyEvent())
    .input(contentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      let existing = false
      if (id) {
        existing = await db.query.contentTable.findFirst({
          where: and(eq(contentTable.id, id), eq(contentTable.eventId, ctx.event.id)),
        })
      }
      if (existing) {
        await db.update(contentTable).set(data).where(eq(contentTable.id, id))
        const content = await db.query.contentTable.findFirst({
          where: and(eq(contentTable.id, id)),
        })
        redis.del(`event_heavy:${ctx.event.id}`)
        return content
      } else {
        const contentRows = await db
          .insert(contentTable)
          .values({ ...data, id, eventId: ctx.event.id, status: 'published' })
          .returning()
        redis.del(`event_heavy:${ctx.event.id}`)
        return contentRows[0]
      }
    }),
})
