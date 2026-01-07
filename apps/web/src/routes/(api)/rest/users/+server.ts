import { error, json } from '@sveltejs/kit'

import { and, db, eq, eventApiKeyTable, eventTable, eventUserTable } from '@matterloop/db'
import { dayjs } from '@matterloop/util'

import type { RequestHandler } from './$types'

async function validateApiKey(apiKey: string, domain: string) {
	if (!apiKey || !apiKey.startsWith('el_')) {
		return null
	}

	// Find the API key in the database
	const keyRecord = await db.query.eventApiKeyTable.findFirst({
		where: eq(eventApiKeyTable.key, apiKey),
		with: {
			event: true,
		},
	})

	if (!keyRecord || !keyRecord.event) {
		return null
	}

	// Verify the API key belongs to an event that matches this domain
	const event = await db.query.eventTable.findFirst({
		where: and(eq(eventTable.id, keyRecord.eventId)),
	})

	if (!event) {
		return null
	}

	// Update last used timestamp
	await db
		.update(eventApiKeyTable)
		.set({ lastUsedAt: dayjs().toISOString() })
		.where(eq(eventApiKeyTable.id, keyRecord.id))

	return { event, apiKey: keyRecord }
}

export const GET: RequestHandler = async ({ request, url }) => {
	const authHeader = request.headers.get('Authorization')
	const apiKey = authHeader?.replace('Bearer ', '')

	if (!apiKey) {
		throw error(401, 'API key required')
	}

	const domain = url.hostname
	const validation = await validateApiKey(apiKey, domain)

	if (!validation) {
		throw error(401, 'Invalid API key')
	}

	const { event } = validation

	// Get all event users for this event
	const eventUsers = await db.query.eventUserTable.findMany({
		where: eq(eventUserTable.eventId, event.id),
		with: {
			user: {
				with: {
					photo: true,
				},
			},
		},
	})

	// Return user data (excluding sensitive fields)
	const usersData = eventUsers.map((eu) => ({
		id: eu.user.id,
		firstName: eu.user.firstName,
		lastName: eu.user.lastName,
		email: eu.user.email,
		type: eu.type,
		status: eu.status,
		company: eu.company,
		title: eu.title,
		bio: eu.bio,
		photo: eu.user.photo
			? {
					id: eu.user.photo.id,
					url: eu.user.photo.url,
				}
			: null,
	}))

	return json({ users: usersData })
}
