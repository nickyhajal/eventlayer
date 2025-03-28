// lib/trpc/router.ts
import { error } from '@sveltejs/kit'
import { initTRPC } from '@trpc/server'
import { AVATAR_API_KEY, AVATAR_API_USER, BASE_HOST } from '$env/static/private'
import { z } from 'zod'

import {
	and,
	createUserSchema,
	db,
	eq,
	Event,
	eventSchema,
	eventTable,
	eventTicketTable,
	EventUser,
	eventUserConnectionTable,
	eventUserInfoTable,
	eventUserTable,
	formElementTable,
	formResponseTable,
	formTable,
	ilike,
	inArray,
	like,
	loginLinkTable,
	lt,
	makeFullEventUser,
	ne,
	or,
	upsertEventUserSchema,
	userSchema,
	venueSchema,
	venueTable,
} from '@matterloop/db'
import { userTable, type User } from '@matterloop/db/types'
import { dayjs, getId, omit, pick, plural } from '@matterloop/util'

import { mailer } from '../../../../apps/web/src/lib/server/core/mailer'
import { NotAuthdError } from '../core/Errors'
import { redis } from '../core/redis'
import { getMediaRow } from '../media/getMediaRow'
import { getSignedUploadUrl } from '../media/getSignedUploadUrl'
import { ActiveLoginLink } from '../models/ActiveLoginLink'
import {
	procedureWithContext,
	verifyAdmin,
	verifyEvent,
	verifyMe,
	type TrpcContext,
} from '../procedureWithContext'
import { getAvatarApiData } from '../util/getAvatarApiData'

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

export async function sendWelcomeEmail(user: User, event: Event, eventUser: EventUser) {
	const { url } = await ActiveLoginLink.generate({
		userId: user.id,
		event: event,
		codeLength: 10,
	})

	const sig = event?.name
		? `The ${event?.name} Team`.replace('The The', 'The')
		: 'The Eventlayer Team'
	if (url) {
		const res = await mailer.send({
			to: user?.email ?? '',
			subject: `Action Required: Claim Your ${event?.name} Ticket`,
			event: event,
			more_params: {
				body: `<p style="margin-bottom: 16px;">Hey ${user?.firstName},</p>
								<p style="margin-bottom: 16px;">We’re excited to have you join us for ${event?.name}!</p>
								<p style="margin-bottom: 24px;">Click the link below to claim your ticket and set up your account.</p>
								<p style="margin-bottom: 32px;">Here's the link: <a href="${url}">${url}</a></p>
								<p style="margin-bottom: 16px;">See you soon!<br>${sig}</p>`,
			},
		})
	}
	await db
		.update(eventUserTable)
		.set({ onboardStatus: 'pending' })
		.where(eq(eventUserTable.id, eventUser.id))
	redis.del(`event_users:${event.id}`)
	redis.del(`event_usersWithInfo:${event.id}`)
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
						ilike(userTable.firstName, `%${input.q}%`),
						ilike(userTable.lastName, `%${input.q}%`),
						ilike(userTable.email, `%${input.q}%`),
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
					event: ctx.event,
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
	toggleConnection: procedureWithContext
		.use(verifyMe())
		.use(verifyEvent())
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			console.log('ctx.me', ctx.me)
			const existing = await db.query.eventUserConnectionTable.findFirst({
				where: and(
					eq(eventUserConnectionTable.eventId, ctx.event.id),
					eq(eventUserConnectionTable.fromId, ctx.me.id),
					eq(eventUserConnectionTable.toId, input.userId),
				),
			})
			if (existing) {
				await db
					.delete(eventUserConnectionTable)
					.where(eq(eventUserConnectionTable.id, existing.id))
			} else {
				console.log('inserting', ctx.me.id, input.userId)
				await db.insert(eventUserConnectionTable).values({
					type: 'friend',
					status: 'active',
					eventId: ctx.event.id,
					fromId: ctx.me.id,
					toId: input.userId,
				})
			}
			return {
				success: true,
			}
		}),
	syncLinkedInData: procedureWithContext
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.id, input.userId),
			})
			if (user?.email) {
				let data = await getAvatarApiData(user?.email, 'LinkedIn')
				const row = data
				if (!row.Success) {
					data = await getAvatarApiData(user?.email)
				}
				const li = JSON.parse(row.RawData).persons[0]
				const mimetype = 'image/jpeg'

				let fimg = await fetch(row.Image)
				let imageBuffer = Buffer.from(await fimg.arrayBuffer())
				const media = await getMediaRow({
					userId: user.id,
					eventId: ctx.event.id,
					mimetype,
					path: '',
					parentType: 'user',
					parentId: user.id,
				})
				if (li?.headline) {
					await db
						.insert(eventUserInfoTable)
						.values({ key: 'headline', value: li.headline, userId: user.id, eventId: ctx.me.id })
						.onConflictDoUpdate({
							target: [
								eventUserInfoTable.key,
								eventUserInfoTable.userId,
								eventUserInfoTable.eventId,
							],
							set: { value: li.headline },
						})
				}
				if (li?.summary) {
					await db
						.insert(eventUserInfoTable)
						.values({ key: 'bio', value: li.summary, userId: user.id, eventId: ctx.me.id })
						.onConflictDoUpdate({
							target: [
								eventUserInfoTable.key,
								eventUserInfoTable.userId,
								eventUserInfoTable.eventId,
							],
							set: { value: li.summary },
						})
				}
				if (media?.id) {
					const source = `${media.dir}/${media.path}/${media.id}-${media.version}.${media.ext}`
					const url = await getSignedUploadUrl(source, mimetype)
					const formData = new FormData()
					const imageFile = new File([imageBuffer], 'avatar.jpg', { type: mimetype })
					formData.append('image', imageFile)
					if (url) {
						try {
							const uploadReq = await fetch(url, {
								method: 'PUT',
								headers: {
									'Content-Type': mimetype, // Make sure the Content-Type header is set correctly
								},
								body: imageBuffer,
							})
							const uploadRes = await uploadReq.text()
							await db.update(userTable).set({ mediaId: media.id }).where(eq(userTable.id, user.id))
							return {
								url: url || '',
								media: row,
							}
						} catch (e) {
							console.log(e)
						}
					}
				}
				return data
			}
		}),
	sendMagicLinkEmail: procedureWithContext
		.input(z.object({ email: z.string(), to: z.string().optional() }))
		.mutation(async ({ ctx, input }) => {
			const user = await db.query.userTable.findFirst({ where: eq(userTable.email, input.email) })
			if (!user) {
				return error(401, 'No user found')
			}

			const { code, url } = await ActiveLoginLink.generate({
				userId: user.id,
				event: ctx.event,
				to: input.to,
				codeLength: 4,
			})

			const sig = ctx.event?.name ? `The ${ctx.event?.name} Team` : 'The Eventlayer Team'
			if (url) {
				const res = await mailer.send({
					to: user?.email ?? '',
					subject: 'Your Magic Login Link',
					event: ctx.event,
					more_params: {
						body: `Hey ${user?.firstName},
						<br><br>Here's your login code:<div style="font-size: 26pt; font-weight: 800; margin-bottom: 16px;">${code}</div>
						Or, click this link: ${url} 
						<br><br>It expires in 24 hours.<br><br>If you didn't request this, you can ignore this email.
						<br><br>All the best,<br>${sig}`,
					},
				})
				console.log('send res', res)
			}
			return {
				success: true,
			}
		}),
	sendWelcomeEmail: procedureWithContext
		.use(verifyAdmin())
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const user = await db.query.userTable.findFirst({ where: eq(userTable.id, input.userId) })
			if (!user) {
				return error(401, 'No user found')
			}
			const eventUser = await db.query.eventUserTable.findFirst({
				where: and(eq(eventUserTable.userId, user.id), eq(eventUserTable.eventId, ctx.event.id)),
			})
			if (!eventUser) {
				return error(401, 'No user found')
			}
			await sendWelcomeEmail(user, ctx.event, eventUser)

			return {
				success: true,
			}
		}),
	sendAssignEmail: procedureWithContext
		.use(verifyAdmin())
		.input(z.object({ assignKey: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const tickets = await db.query.eventTicketTable.findMany({
				where: eq(eventTicketTable.assignKey, input.assignKey),
			})
			if (!tickets?.length || !tickets?.[0]?.userId) {
				return error(401, 'No tickets found')
			}
			const user = await db.query.userTable.findFirst({
				where: eq(userTable.id, tickets[0].userId),
			})
			if (!user) {
				return error(401, 'No user found')
			}

			const sig = ctx.event?.name
				? `The ${ctx.event?.name} Team`.replace('The The', 'The')
				: 'The Eventlayer Team'
			let path = `welcome/${input.assignKey}`
			let host = BASE_HOST // ctx.req.url.host
			let url = `https://${ctx.event?.domainId}.${host}/${path}`
			if (ctx.event.domainId.includes('.')) {
				url = `https://${ctx.event.domainId}/${path}`
			}
			if (url) {
				const res = await mailer.send({
					to: user?.email || '',
					subject: `Action Required: Assign Your ${ctx.event?.name} Ticket`,
					event: ctx.event,
					more_params: {
						body: `<p style="margin-bottom: 16px;">Hey ${user?.firstName},</p>
								<p style="margin-bottom: 16px;">We’re excited to have you join us for ${ctx.event?.name}!</p>
								<p style="margin-bottom: 16px;">You have <b>${tickets.length} ${plural(tickets.length, 'ticket')}</b>.</p>
								<p style="margin-bottom: 16px;">Click below to claim or assign your ${plural(tickets.length, 'ticket')}.</p>
								<p style="margin-bottom: 16px;">Here's the link: <a href="${url}">${url}</a></p>
								<p style="margin-bottom: 32px;">If you have any questions, reply to this email or please reach out to us at <a href="mailto:${ctx.event?.settings?.email}">${ctx.event?.replyEmail}</a>.</p>
								<p style="margin-bottom: 16px;">See you soon!<br>${sig}</p>`,
					},
				})
			}
			await db
				.update(eventTicketTable)
				.set({ status: 'sent' })
				.where(eq(eventTicketTable.assignKey, input.assignKey))
			return {
				success: true,
			}
		}),
	upsert: procedureWithContext
		// .use(verifyMe())
		.use(verifyEvent())
		.input(upsertEventUserSchema)
		.mutation(async ({ ctx, input }) => {
			const eventId = ctx.event?.id as string
			const { id, ...data } = input
			if (!(ctx.me?.isSuperAdmin || data.userId === ctx.me?.id)) {
				return NotAuthdError()
			}
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
				info,
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
				if (Object.values(userData).filter((v) => v).length) {
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
					let onboardingFormId: string | null = null
					const onboardingForm = await db.query.formTable.findFirst({
						where: and(eq(formTable.eventId, eventId), eq(formTable.type, 'onboarding')),
					})
					if (onboardingForm) {
						onboardingFormId = onboardingForm.id
					}
					await db
						.insert(eventUserTable)
						.values({
							type: eventUserData.type,
							userId: user.id,
							eventId: eventId,
							onboardFormId: onboardingFormId,
						})
						.returning()
					eventUser = await db.query.eventUserTable.findFirst({
						where: and(eq(eventUserTable.userId, user.id), eq(eventUserTable.eventId, eventId)),
					})
				} else if (userId) {
					if (Object.values(eventUserData).filter((v) => v).length) {
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

			// There are a few user table keys that we may also want to sync to
			// an onboarding form
			const userTableKeys = ['firstName', 'lastName']
			if (info && userId) {
				userTableKeys.forEach((key) => {
					if (input?.[key]) {
						info[key] = { value: input?.[key] }
					}
				})

				await Promise.all(
					Object.entries(info).map(async ([key, { value }]) => {
						// We don't want to save userTableKey to the eventUserInfoTable
						if (!userTableKeys.includes(key)) {
							const existing = await db.query.eventUserInfoTable.findFirst({
								where: and(
									eq(eventUserInfoTable.userId, userId),
									eq(eventUserInfoTable.eventId, eventId),
									eq(eventUserInfoTable.key, key),
								),
							})
							if (!existing) {
								await db
									.insert(eventUserInfoTable)
									.values({ userId, key, value, eventId, public: true })
							} else {
								await db
									.update(eventUserInfoTable)
									.set({ value })
									.where(
										and(
											eq(eventUserInfoTable.userId, userId),
											eq(eventUserInfoTable.eventId, eventId),
											eq(eventUserInfoTable.key, key),
										),
									)
							}
						}

						// We want to find all the form elements with this userInfoKey
						// that don't have updated responses by this user
						const relatedElements = await db
							.select()
							.from(formResponseTable)
							.leftJoin(formElementTable, eq(formResponseTable.elementId, formElementTable.id))
							.where(
								and(
									eq(formElementTable.userInfoKey, key),
									eq(formResponseTable.userId, userId),
									eq(formResponseTable.eventId, eventId),
									ne(formResponseTable.value, value),
								),
							)
						if (relatedElements.length && value) {
							const ids = relatedElements.flatMap(({ form_response }) => form_response?.id ?? [])
							await db
								.update(formResponseTable)
								.set({ value })
								.where(
									and(inArray(formResponseTable.id, ids), eq(formResponseTable.userId, userId)),
								)
						}
					}),
				)
			}
			redis.del(`event_heavy:${eventId}`)
			redis.del(`event_users:${eventId}`)
			redis.del(`event_usersWithInfo:${eventId}`)
			return {
				user,
				eventUser,
			}
		}),
})
