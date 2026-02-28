// lib/trpc/router.ts
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { db, eq, eventSchema, formSchema, formTable } from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { pick } from '@matterloop/util'

import {
  procedureWithContext,
  verifyEvent,
  verifyMe,
  type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const formProcedures = t.router({
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
    .input(formSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      if (input.id) {
        await db.update(formTable).set(data).where(eq(formTable.id, input.id)).returning()
        const updated = await db.select().from(formTable).where(eq(formTable.id, input.id))
        return updated[0]
      } else {
        data.eventId = ctx.event.id
        const newForm = await db.insert(formTable).values(data).returning()
        return newForm[0]
      }
    }),
})
