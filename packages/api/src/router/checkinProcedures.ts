// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	db,
	eq,
	eventTable,
	eventUserCheckinTable,
	pageSchema,
	pageTable,
} from '@matterloop/db'

import { EventFns } from '../models/eventFns'
import {
	procedureWithContext,
	verifyAdmin,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const checkinProcedures = t.router({
	toggle: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(z.object({ userId: z.string(), eventId: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			try {
				let eventId = ctx.event.id
				let mainEventId = undefined
				if (input.eventId) {
					let subEvent = await db.query.eventTable.findFirst({
						where: eq(eventTable.id, input.eventId),
					})

					// Can only check in to main event or parent event
					if (subEvent && subEvent.eventId === eventId) {
						mainEventId = eventId
						eventId = subEvent.id
					} else {
						throw error(404, 'Event not found')
					}
				}
				const eventFns = EventFns({ eventId, mainEventId })
				const change = await eventFns.toggleUserCheckin({
					staffId: ctx?.me?.id || '',
					userId: input.userId,
				})
				const stats = await eventFns.getCheckinStats()
				return { change, stats }
			} catch (e) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: e.message,
					cause: e,
				})
			}
		}),
})
