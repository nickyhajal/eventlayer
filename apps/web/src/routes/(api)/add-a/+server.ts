import { error, json } from '@sveltejs/kit'
import { getStripeDataFromSession } from '$lib/stripe'
import { z } from 'zod'

import { redis } from '@matterloop/api/src/core/redis'
import {
	and,
	db,
	eq,
	eventTicketTable,
	eventUserConnectionTable,
	eventUserInfoTable,
	eventUserTable,
	formResponseTable,
	formSessionTable,
	isNull,
	mediaTable,
	userTable,
} from '@matterloop/db'
import dayjs from '@matterloop/util/src/lib/dayjs'

import type { RequestHandler } from './$types'


// setup for a new year
// - update the current year id
// - update the previous year id
// - copy form and get onboarding form id
// - copy form_elements

const CURRENT_YEAR_ID = 'ba3e8c2a-094b-4694-9a75-9fd75a4e00f7'
const PREVIOUS_YEAR_ID = 'd7ee6ca9-5df0-44ec-be1e-6ba1d2d895a4'
const ONBOARDING_FORM_ID = '5a27333c-0d33-426d-b726-7bdd1792cb8b'
const PREVIOUS_YEAR_ONBOARDING_FORM_ID = 'c2446d19-52fb-4dcd-a7da-3fd373189c6f'
const KIT_FORM_ID = '9235118'

const schema = z.object({
	cid: z.string(),
	attendees: z.array(
		z.object({
			name: z.string(),
			email: z.string().email(),
		}),
	),
})
const fieldMap: Record<string, string> = {
	// '64021b5d-2b4d-4fb2-bdcd-6bc6aa81f5f8': 'aa1d806d-26ef-4c05-b8b9-a4c36861c9fc',
	// First Name
	'aa1d806d-26ef-4c05-b8b9-a4c36861c9fc': 'a3b23778-b44f-4971-8a79-687be7bd053b',
	// '2ff7bd05-56da-4ba0-a9c0-71a9ad320f07': '84c0afc4-67ea-4494-b824-96a259f48232',
	// Last name
	'84c0afc4-67ea-4494-b824-96a259f48232': '1925f3c0-052a-424d-b5f4-63186d5433d1',
	// Where are you based?
	// 'cf1b5075-2095-42c1-a5fd-6c6755d6f6da': 'b5c57414-e5c7-4502-a59f-3b1f3f1e9766',
	'b5c57414-e5c7-4502-a59f-3b1f3f1e9766': 'a95dafe3-0093-457a-8cd8-968b5551c01d',
	// Pronouns
	'4bf0e15e-afeb-4310-8857-45e797e490ec': 'a2a7f27b-af51-471a-ab7f-6f8785d3429f',
	// Tshirt
	// 'dcf86b20-2632-4364-a1bf-c60043ee8799': 'fdeda3e2-8771-45e6-b671-3dc35231dd7a',
	'fdeda3e2-8771-45e6-b671-3dc35231dd7a': '526ea94a-2998-4785-9df2-2b5cb820f93a',
	// Company
	// 'c3938c19-a516-47b7-8a35-d0e0c99cbac8': '20431479-7675-41a8-a75a-ffb46ca10f11',
	'20431479-7675-41a8-a75a-ffb46ca10f11': '7adf892f-6444-46b9-a75c-392b5624242b',
	// Your Personal Title
	// '0240d99c-cf3a-486e-bb73-d14ee5f92eaa': '14a0295e-f1cb-4000-b434-1fec77cc9b1b',
	'14a0295e-f1cb-4000-b434-1fec77cc9b1b': 'f2b91687-c297-4630-ad16-c81077f99242',
	// Short n Sweet Bio
	// 'f154d92f-e51f-4aef-bde0-acff359479c6': '306bbab1-efdc-4f0b-8614-014e30f81bbc',
	'306bbab1-efdc-4f0b-8614-014e30f81bbc': 'b2045374-934d-4991-b63f-bfc032d81235',
	// Website URL
	// '6eb6a196-b9f1-4d0d-be29-a152049e0dc6': '2692a0ee-ba28-4ea1-9aca-232493dac808',
	'2692a0ee-ba28-4ea1-9aca-232493dac808': '2879ce86-675a-4600-9ee0-fc5d61d7d39e',
	// LinkedIn URL
	// 'f56874c4-905b-4a77-8f7c-248c0e39beb5': 'd5e0ce40-824b-4f6f-85ca-501d2037f4e2',
	'd5e0ce40-824b-4f6f-85ca-501d2037f4e2': '92e12f16-317e-4abf-be18-146716866816',
	// Insta
	// '20360b0f-f1da-4234-9dea-0f09c2cc4e45': 'd443c3bf-9052-40d4-90cc-5e54c0b4bec4',
	'd443c3bf-9052-40d4-90cc-5e54c0b4bec4': 'df69f6b4-d9d5-4f80-a75d-94f2e66306c2',
	// FB
	// '6fed3751-782c-4b70-add0-b698595a3598': 'c52fddd9-eedb-4975-802e-36bf6db90e5c',
	'c52fddd9-eedb-4975-802e-36bf6db90e5c': 'dcc1ca4e-6ab5-42b0-b459-c67c6c3bef6a',
	// Phone
	// '2bfebf1b-6e5f-4239-bc68-01e11bb088fb': '7cf7738a-5afd-41e2-88cf-f869d61c46b9',
	'7cf7738a-5afd-41e2-88cf-f869d61c46b9': '7384a8fa-2f2b-4667-b49d-05c6d704ec50',
	// Superpower
	// 'e6fc0a2f-9ae0-468e-a3e0-489a0a292ea4': '7c7fff51-e951-409d-9c37-45174d8a19dd',
	'7c7fff51-e951-409d-9c37-45174d8a19dd': '0cb3d95f-f535-43a2-b502-f0f0ac5ff299',
	// Ask me about
	// '7861100c-2d8e-4b34-a4fc-382419491388': '99323839-cd91-44ce-86fc-e539c949a16f',
	'99323839-cd91-44ce-86fc-e539c949a16f': '7ef9132d-68c7-44a9-9a3e-0885e1f27481',
	// What’s something you wish people understood about your brain?
	'589ed5a1-2ed2-4541-8341-fb4da41cff81': '5d2ad24c-0822-46e2-80ad-287d539c6af5',
	// What are you excited about right now?
	'8c7048d6-1e1b-4e22-a3cf-229589e2bab6': 'c9ceb530-091d-4dd3-a1bc-716acbe67d69',
	// What brought you to NeuroDiversion?
	'3a714f71-4433-438f-a720-a9b26b73fffb': 'b2c58862-7c23-4b74-a101-8d0239b20bbb',
	// Message to Team
	// '50940010-dc37-445f-bfc4-d727ca4fa7af': 'b6a42af8-0d3c-40dc-9efe-95ef12caff0e',
	'b6a42af8-0d3c-40dc-9efe-95ef12caff0e': '076b2bed-3803-4957-8ba5-e704205ab76f',
}

const getNameParts = (name: string) => {
	const firstSpace = name.indexOf(' ')
	const firstName = name.substring(0, firstSpace)
	const lastName = name.substring(firstSpace + 1)
	return { firstName, lastName }
}

const getOrCreateUser = async (email: string, name: string) => {
	let user = await db.query.userTable.findFirst({
		where: eq(userTable.email, email),
	})
	const { firstName, lastName } = getNameParts(name)
	if (user) {
		if (!user.firstName) {
			await db.update(userTable).set({ firstName, lastName }).where(eq(userTable.id, user.id))
		}
	}
	if (!user) {
		const inserted = await db
			.insert(userTable)
			.values({
				email,
				firstName,
				lastName,
			})
			.returning()
		if (inserted) {
			user = inserted[0]
		}
	}
	if (user) {
		return user
	}
}

const getOrCreateEventUser = async (userId: string, type: string) => {
	let eventUser = await db.query.eventUserTable.findFirst({
		where: and(
			eq(eventUserTable.userId, userId),
			eq(eventUserTable.eventId, CURRENT_YEAR_ID),
		),
	})
	if (eventUser) {
		return eventUser
	}
	const previousYearEventUser = await db.query.eventUserTable.findFirst({
		where: and(
			eq(eventUserTable.userId, userId),
			eq(eventUserTable.eventId, PREVIOUS_YEAR_ID),
		),
	})

	const inserted = await db
		.insert(eventUserTable)
		.values({
			userId,
			type,
			eventId: CURRENT_YEAR_ID,
			status: 'active',
			onboardStatus: 'not-sent',
			proBio: previousYearEventUser?.proBio,
			bio: previousYearEventUser?.bio,
			url: previousYearEventUser?.url,
			company: previousYearEventUser?.company,
			title: previousYearEventUser?.title,
			internalNotes: previousYearEventUser?.internalNotes,
			onboardFormId: ONBOARDING_FORM_ID,
		})
		.returning()
	if (inserted) {
		eventUser = inserted[0]
	}
	if (previousYearEventUser?.userId && previousYearEventUser?.eventId) {
		const previousInfo = await db.query.eventUserInfoTable.findMany({
			where: and(
				eq(eventUserInfoTable.userId, previousYearEventUser.userId),
				eq(eventUserInfoTable.eventId, previousYearEventUser.eventId),
			),
		})
		if (previousInfo?.length) {
			previousInfo.forEach((row, i) => {
				const { id, createdAt, updatedAt, ...info } = row
				previousInfo[i] = {
					...info,
					userId,
					eventId: CURRENT_YEAR_ID,
				}
			})
			await db.insert(eventUserInfoTable).values(previousInfo)
		}
		const connections = await db.query.eventUserConnectionTable.findMany({
			where: and(
				eq(eventUserConnectionTable.fromId, previousYearEventUser.userId),
				eq(eventUserConnectionTable.eventId, previousYearEventUser.eventId),
			),
		})
		if (connections?.length) {
			connections.forEach((row, i) => {
				const { id, createdAt, updatedAt, ...info } = row
				connections[i] = {
					...info,
					fromId: userId,
					eventId: CURRENT_YEAR_ID,
				}
			})
			await db.insert(eventUserConnectionTable).values(connections)
		}
		const responses = await db.query.formResponseTable.findMany({
			where: and(
				eq(formResponseTable.userId, previousYearEventUser.userId),
				eq(formResponseTable.formId, PREVIOUS_YEAR_ONBOARDING_FORM_ID),
			),
		})
		if (responses?.length) {
			const sessionRes = await db
				.insert(formSessionTable)
				.values({
					userId: userId,
					eventId: CURRENT_YEAR_ID,
					formId: ONBOARDING_FORM_ID,
					status: 'submitted',
					submissionDate: dayjs().format('YYYY-MM-DD'),
				})
				.returning()
			if (sessionRes?.[0]) {
				const session = sessionRes[0]
				responses.forEach((row, i) => {
					const { id, createdAt, updatedAt, ...info } = row
					if (fieldMap[info?.elementId ?? '']) {
						responses[i] = {
							...info,
							userId: userId,
							eventId: CURRENT_YEAR_ID,
							formId: ONBOARDING_FORM_ID,
							elementId: fieldMap[info.elementId ?? ''],
							sessionId: session.id,
							value: info.value,
						}
					}
				})
				await db.insert(formResponseTable).values(responses)
			}
			await db
				.update(mediaTable)
				.set({
					eventId: CURRENT_YEAR_ID,
				})
				.where(
					and(
						eq(mediaTable.userId, userId),
						eq(mediaTable.eventId, PREVIOUS_YEAR_ID),
					),
				)
		}
	}
	await redis.del(`event_users:${CURRENT_YEAR_ID}`)
	await redis.del(`event_usersWithInfo:${CURRENT_YEAR_ID}`)
	await redis.del(`event_heavy:${CURRENT_YEAR_ID}`)
	return eventUser
}

async function addToKit(email: string, name: string) {
	const url = `https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers`
	try {
		console.log('add to kit - attendees', email, name)
		await fetch(`https://api.kit.com/v4/subscribers`, {
			method: 'POST',
			body: JSON.stringify({
				email_address: email,
				first_name: name,
			}),
			headers: {
				'Content-Type': 'application/json',
				'X-Kit-Api-Key': `kit_84309a9eff8218e4b7aebae051c8b09c`,
			},
		})
		const rsp = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({
				email_address: email,
				name: name,
			}),
			headers: {
				'Content-Type': 'application/json',
				'X-Kit-Api-Key': `kit_84309a9eff8218e4b7aebae051c8b09c`,
			},
		})
		const data = await rsp.text()
	} catch (e) {
		console.error('Failed to add to Kit', e)
	}
}

export const POST: RequestHandler = async ({ url, request }) => {
	// Extract checkout ID from query parameters
	const body = await request.json()
	try {
		const { cid, attendees } = schema.parse(body)
		const stripe = await getStripeDataFromSession(cid)
		const quantity = stripe.line_items[0].quantity ?? 0
		if (quantity < attendees.length) {
			throw error(400, 'Quantity does not match attendees length')
		}
		const tickets = await db.query.eventTicketTable.findMany({
			where: and(eq(eventTicketTable.type, cid), isNull(eventTicketTable.assignedTo)),
		})
		if (tickets.length < attendees.length) {
			throw error(400, 'Not enough tickets to add attendees')
		}
		await Promise.all(
			Array(attendees.length)
				.fill(0)
				.map(async (_, i) => {
					const attendee = attendees[i]
					const user = await getOrCreateUser(attendee.email, attendee.name)
					if (!user) {
						throw error(400, 'Could not create user')
					}
					const eventUser = await getOrCreateEventUser(user.id, 'attendee')
					if (!eventUser) {
						throw error(400, 'Could not create event user')
					}
					const kitRsp = await addToKit(attendee.email, attendee.name)

					return db
						.update(eventTicketTable)
						.set({
							assignedTo: user.id,
							assignedOn: dayjs().toISOString(),
							status: 'assigned',
						})
						.where(eq(eventTicketTable.id, tickets[i].id))
				}),
		)

		return json(stripe)
	} catch (e) {
		console.error(e)
		throw error(400, e?.body?.message ?? 'Invalid attendee data')
	}
}
