// lib/trpc/router.ts
import {
	and,
	db,
	eq,
	eventSchema,
	eventTable,
	EventUser,
	eventUserTable,
	like,
	makeFullEventUser,
	or,
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

function scoreMatch(query: string, value: string): number {
	if (value.toLowerCase().startsWith(query.toLowerCase())) {
		return 2 // Higher score if the string starts with the query
	} else if (value.toLowerCase().includes(query.toLowerCase())) {
		return 1 // Lower score for a substring match
	}
	return 0 // No match
}

function sortBestMatches(query: string, people: User[]): User[] {
	return people.sort((a, b) => {
		// Calculate the total score for each person
		const scoreA =
			scoreMatch(query, a.firstName) + scoreMatch(query, a.lastName) + scoreMatch(query, a.email)
		const scoreB =
			scoreMatch(query, b.firstName) + scoreMatch(query, b.lastName) + scoreMatch(query, b.email)

		// Sort by the total score in descending order
		if (scoreA > scoreB) return -1
		if (scoreA < scoreB) return 1

		// If scores are equal, you can add more sorting criteria here
		return 0
	})
}

const t = initTRPC.context<TrpcContext>().create()
export const userProcedures = t.router({
	search: procedureWithContext.input(z.object({ q: z.string() })).query(async ({ ctx, input }) => {
		const users = await db
			.select()
			.from(userTable)
			.leftJoin(eventUserTable, eq(eventUserTable.userId, userTable.id))
			.where(
				and(
					eq(eventUserTable.eventId, ctx.event?.id),
					or(
						like(userTable.firstName, `%${input.q}%`),
						like(userTable.lastName, `%${input.q}%`),
						like(userTable.email, `%${input.q}%`),
					),
				),
			)
		return sortBestMatches(
			input.q,
			users.map((user) => makeFullEventUser({ user: user.auth_user, eventUser: user.event_user })),
		)
	}),
	checkEmail: procedureWithContext
		.input(
			z.object({
				email: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			let emailExists: User | false = false
			let eventUserExists: EventUser | false = false
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.email, input.email),
			})
			if (user?.id) {
				emailExists = user
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

			let user: User | undefined | null
			let eventUser: EventUser | undefined | null
			if (!userId) {
				const users = await db.insert(userTable).values(userData).returning()
				user = users[0]
			} else {
				if (Object.values(userData).length) {
					await db.update(userTable).set(userData).where(eq(userTable.id, userId))
				}
				user = await db.query.userTable.findFirst({
					where: and(eq(userTable.id, userId)),
				})
			}
			if (eventId && user) {
				eventUser = await db.query.eventUserTable.findFirst({
					where: and(eq(eventUserTable.userId, user.id), eq(eventUserTable.eventId, eventId)),
				})
				if (!id && !eventUser) {
					await db
						.insert(eventUserTable)
						.values({ type: eventUserData.type, userId: user.id, eventId: eventId })
						.returning()
					eventUser = await db.query.eventUserTable.findFirst({
						where: and(eq(eventUserTable.userId, user.id), eq(eventUserTable.eventId, eventId)),
					})
				} else if (userId) {
					if (Object.values(eventUserData).length) {
						await db
							.update(eventUserTable)
							.set(eventUserData)
							.where(and(eq(eventUserTable.userId, userId), eq(eventUserTable.eventId, eventId)))
							.returning()
					}
					eventUser = await db.query.eventUserTable.findFirst({
						where: and(eq(eventUserTable.userId, userId), eq(eventUserTable.eventId, eventId)),
					})
				}
			}
			return {
				user,
				eventUser,
			}
		}),
})
