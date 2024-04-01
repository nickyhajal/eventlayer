import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { db } from '@matterloop/db'
import { formElementSchema, formElementTable, eq, inArray } from '@matterloop/db'
import { groupBy } from '@matterloop/util'
import { TrpcContext, procedureWithContext, verifyMe } from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

const deleteSchema = z.object({
	id: z.string(),
})

export const formElementProcedures = t.router({
	upsert: procedureWithContext
		// .use(verifyMe())
		.input(formElementSchema)
		.mutation(async ({ ctx, input }) => {
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
		.mutation(async ({ ctx, input }) => {
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
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			try {
				const { changes } = input
				await Promise.all(
					changes.map(async ({ id, ord }) => {
						const children = await db.query.formElementTable.findMany({
							where: eq(formElementTable.formElementId, id),
						})
						const byOrder = groupBy(children, 'ord')
						Object.entries(byOrder).forEach(async ([order, elements]) => {
							const bits = `${order}`.split('.')
							const newOrd = `${ord}.${bits[1]}`
							const ids = elements.map(({ id }) => id)
							await db
								.update(formElementTable)
								.set({ ord: +newOrd })
								.where(inArray(formElementTable.id, ids))
						})
						return db.update(formElementTable).set({ ord }).where(eq(formElementTable.id, id))
					}),
				)
				return new Response('Success', { status: 200 })
			} catch (e) {
				return new Response('Error', { status: 500 })
			}
		}),
})
