import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import { db, eq, formElementSchema, formElementTable, inArray } from '@matterloop/db'
import { groupBy } from '@matterloop/util'

import { procedureWithContext, verifyMe } from '../procedureWithContext'
import type { TrpcContext } from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

const deleteSchema = z.object({
  id: z.string(),
})

export const formElementProcedures = t.router({
  upsert: procedureWithContext
    // .use(verifyMe())
    .input(formElementSchema)
    .mutation(async ({ input }) => {
      const { createdAt, id } = input
      if (!createdAt) {
        const newForm = await db.insert(formElementTable).values(input).returning()
        return newForm[0]
      } else {
        if (id) {
          const updatedForm = await db
            .update(formElementTable)
            .set(input)
            .where(eq(formElementTable.id, id))
            .returning()
          return updatedForm[0]
        }
      }
      return false
    }),
  delete: procedureWithContext
    .use(verifyMe())
    .input(deleteSchema)
    .mutation(async ({ input }) => {
      await db.delete(formElementTable).where(eq(formElementTable.id, input.id))
      return true
    }),
  order: procedureWithContext
    // .use(verifyMe())
    .input(
      z.object({
        id: z.string().min(8),
        changes: z.array(
          z.object({
            id: z.string(),
            ord: z.number(),
            page: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { changes } = input
        await Promise.all(
          changes.map(async ({ id, ord, page }) => {
            const children = await db.query.formElementTable.findMany({
              where: eq(formElementTable.formElementId, id),
            })
            const byOrder = groupBy(children, 'ord')
            await Promise.all(
              Object.entries(byOrder).map(async ([order, elements]) => {
                const bits = `${order}`.split('.')
                const newOrd = `${ord}.${bits[1]}`
                const ids = elements.map(({ id }) => id)
                await db
                  .update(formElementTable)
                  .set({ ord: +newOrd, ...(page === undefined ? {} : { page }) })
                  .where(inArray(formElementTable.id, ids))
              }),
            )
            return db
              .update(formElementTable)
              .set({ ord, ...(page === undefined ? {} : { page }) })
              .where(eq(formElementTable.id, id))
          }),
        )
        return new Response('Success', { status: 200 })
      } catch (e) {
        return new Response('Error', { status: 500 })
      }
    }),
})
