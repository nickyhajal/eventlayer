// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import { and, db, eq, inArray, menuSchema, menuTable } from '@matterloop/db'
import { groupBy } from '@matterloop/util'

import { redis } from '../core/redis'
import {
	procedureWithContext,
	verifyAdmin,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const menuProcedures = t.router({
	upsert: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(menuSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input
			try {
				if (id) {
					await db.update(menuTable).set(data).where(eq(menuTable.id, id))
					const menu = await db.query.menuTable.findFirst({
						where: and(eq(menuTable.id, id)),
					})
					redis.del(`event_heavy:${ctx.event.id}`)
					return menu
				} else {
					const menuRows = await db
						.insert(menuTable)
						.values({ ...data, eventId: ctx.event.id, status: 'active' })
						.returning()
					redis.del(`event_heavy:${ctx.event.id}`)
					return menuRows[0]
				}
			} catch (e) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: e.message,
					cause: e,
				})
			}
		}),
	delete: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const menu = await db.query.menuTable.findFirst({
					where: and(eq(menuTable.id, input.id)),
				})

				if (!menu) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'Menu item not found',
					})
				}

				await db.delete(menuTable).where(eq(menuTable.id, input.id))
				redis.del(`event_heavy:${ctx.event.id}`)
				return true
			} catch (e) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: e.message,
					cause: e,
				})
			}
		}),
	order: procedureWithContext
		.use(verifyMe())
		.use(verifyAdmin())
		.input(
			z.object({
				eventId: z.string().min(8),
				location: z.string(),
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
						const existing = await db.query.menuTable.findFirst({
							where: eq(menuTable.id, change.id),
						})

						if (!existing)
							throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Menu item not found' })
						return db.update(menuTable).set({ ord: change.ord }).where(eq(menuTable.id, change.id))
					}),
				)
				redis.del(`event_heavy:${ctx.event.id}`)
				return true
			} catch (e) {
				return false
			}
		}),
})
