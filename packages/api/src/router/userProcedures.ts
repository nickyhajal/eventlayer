// lib/trpc/router.ts
import {
	and,
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
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	procedureWithContext,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()
export const userProcedures = t.router({
	checkEmail: procedureWithContext
		.input(
			z.object({
				email: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			let emailExists: User | boolean = false
			let eventUserExists: EventUser | boolean = false
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.email, input.email),
			})
			if (user?.id) {
				emailExists = true
				if (ctx.event?.id) {
					const eventUser = await db.query.eventUserTable.findFirst({
						where: and(
							eq(eventUserTable.userId, user.id),
							eq(eventUserTable.eventId, ctx.event.id),
						),
					})
					if (eventUser) {
						eventUserExists = eventUser
					}
				}
			}
			return {
				emailExists,
				eventUserExists,
			}
		}),
	upsert: procedureWithContext
		// .use(verifyMe())
		.use(verifyEvent())
		.input(upsertEventUserSchema)
		.mutation(async ({ ctx, input }) => {
			const eventId = ctx.event?.id
			const { id, ...data } = input
			const {
				email,
				firstName,
				lastName,
				mediaId,
				userId,
				settings,
				isSuperAdmin,
				createdAt,
				updatedAt,
				photo,
				...eventUserData
			} = data
			const userData = {
				email,
				firstName,
				lastName,
				mediaId,
			}
			if (userId) {
				await db.update(userTable).set(userData).where(eq(userTable.id, userId))
				const user = await db.query.userTable.findFirst({
					where: and(eq(userTable.id, userId)),
				})
				let eventUser: EventUser | undefined | null
				if (eventId) {
					await db
						.update(eventUserTable)
						.set(eventUserData)
						.where(and(eq(eventUserTable.userId, userId), eq(eventUserTable.eventId, eventId)))
						.returning()
					eventUser = await db.query.eventUserTable.findFirst({
						where: and(eq(eventUserTable.userId, userId), eq(eventUserTable.eventId, eventId)),
					})
				}
				return {
					user,
					eventUser,
				}
			} else {
				const users = await db.insert(userTable).values(userData).returning()
				const user = users[0]
				let eventUser: EventUser | undefined | null
				if (user && eventId) {
					await db
						.insert(eventUserTable)
						.values({ type, userId: user.id, eventId: eventId })
						.returning()
					eventUser = await db.query.eventUserTable.findFirst({
						where: and(eq(eventUserTable.userId, user.id), eq(eventUserTable.eventId, eventId)),
					})
				}
				return {
					user,
					eventUser,
				}
			}
		}),
})
