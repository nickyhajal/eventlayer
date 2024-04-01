// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	createUserSchema,
	db,
	eq,
	eventSchema,
	eventTable,
	EventUser,
	eventUserTable,
	like,
	loginLinkTable,
	lt,
	makeFullEventUser,
	or,
	upsertEventUserSchema,
	userSchema,
	venueSchema,
	venueTable,
} from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { dayjs, getId, omit, pick } from '@matterloop/util'

import { mailer } from '../../../../apps/web/src/lib/server/core/mailer'
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
	createAccount: procedureWithContext.input(createUserSchema).mutation(async ({ ctx, input }) => {
		if (!input.id) {
			throw error(401, 'No user id provided')
		}
		if (input.firstName && !input.lastName) {
			const space = input.firstName.indexOf(' ')
			input.lastName = input.firstName.slice(space + 1)
			input.firstName = input.firstName.slice(0, space)
		}
		const existing = await db.query.userTable.findFirst({
			where: and(eq(userTable.id, input.id)),
		})
		if (existing?.id) {
			throw error(401, 'User already exists')
		}
		await db.insert(userTable).values(input).returning()
		const user = await db.query.userTable.findFirst({
			where: and(eq(userTable.id, input.id)),
		})
		if (user?.id) {
			const loginLink = await db
				.insert(loginLinkTable)
				.values({
					userId: user?.id,
					publicId: getId('short'),
					expires: dayjs().add(1, 'day').toISOString(),
				})
				.returning()
			if (loginLink[0]) {
				const res = await mailer.send({
					to: user?.email || '',
					subject: 'Welcome to Dayglow!',
					more_params: {
						body: `Hey ${user?.firstName},
						<br><br>I am so excited you're trying out Dayglow.
						<br><br>I'm extremely committed to creating a valuable tool that helps you get your most important work done everyday.
						<br><br>If there's anything I can to do improve the experience for you, please let me know.
						<br><br>Mind me asking what kind of work you do and what you're hoping for from Dayglow?
						<br><br>Thanks!<br>Nicky from Dayglow`,
					},
				})
				return {
					user,
					code: loginLink[0].publicId,
				}
			}
		}
	}),
	sendMagicLinkEmail: procedureWithContext
		.input(z.object({ email: z.string(), to: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const user = await db.query.userTable.findFirst({ where: eq(userTable.email, input.email) })
			console.log(user)
			if (!user) {
				return error(401, 'No user found')
			}
			await db
				.update(loginLinkTable)
				.set({ publicId: '' })
				.where(lt(loginLinkTable.expires, dayjs().toISOString()))
			const loginLink = await db
				.insert(loginLinkTable)
				.values({
					userId: user.id,
					publicId: getId('short'),
					expires: dayjs().add(1, 'day').toISOString(),
				})
				.returning()
			if (loginLink[0]) {
				const res = await mailer.send({
					to: user?.email || '',
					subject: 'Your Magic Login Link',
					more_params: {
						body: `Hey ${user?.firstName},
						<br><br>Here's your login code:<div style="font-size: 30pt; margin-top: -24px; margin-bottom: 16px;">${
							loginLink[0].publicId
						}</div>
						Or, click this link from your computer: https://eventlayer.co/login/${loginLink[0].publicId}${
							input.to ? `?to=${input.to}` : ''
						}
						<br>It expires in 24 hours.<br><br>If you didn't request this, you can ignore this email.
						<br><br>Thanks,<br>Nicky from Dayglow`,
					},
				})
				console.log('send res', res)
			}
			return {
				success: true,
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
