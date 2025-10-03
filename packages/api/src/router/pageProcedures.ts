// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC, TRPCError } from '@trpc/server'

import { and, db, eq, pageSchema, pageTable } from '@matterloop/db'

import {
  procedureWithContext,
  verifyAdmin,
  verifyEvent,
  verifyMe,
  type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const pageProcedures = t.router({
  upsert: procedureWithContext
    .use(verifyAdmin())
    .use(verifyEvent())
    .input(pageSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      try {
        if (id) {
          await db.update(pageTable).set(data).where(eq(pageTable.id, id))
          const page = await db.query.pageTable.findFirst({
            where: and(eq(pageTable.id, id)),
          })
          return page
        } else {
          const pageRows = await db
            .insert(pageTable)
            .values({ ...data, eventId: ctx.event.id, status: 'published' })
            .returning()
          return pageRows[0]
        }
      } catch (e) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: e.message,
          cause: e,
        })
      }
    }),
})
