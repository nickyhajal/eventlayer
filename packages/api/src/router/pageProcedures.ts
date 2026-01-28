// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import { and, db, eq, ilike, or, pageSchema, pageTable } from '@matterloop/db'

import {
  procedureWithContext,
  verifyAdmin,
  verifyEvent,
  verifyMe,
  type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const pageProcedures = t.router({
  search: procedureWithContext
    .use(verifyEvent())
    .input(z.object({ q: z.string() }))
    .query(async ({ ctx, input }) => {
      const pages = await db.query.pageTable.findMany({
        where: and(
          eq(pageTable.eventId, ctx.event.id),
          or(
            ilike(pageTable.title, `%${input.q}%`),
            ilike(pageTable.subtitle, `%${input.q}%`),
            ilike(pageTable.path, `%${input.q}%`),
          ),
        ),
        limit: 10,
      })
      return pages
    }),
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
