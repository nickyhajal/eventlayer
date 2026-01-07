import { error, json } from '@sveltejs/kit'

import { and, db, eq, eventApiKeyTable, eventTable } from '@matterloop/db'
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

	// Return event data (excluding sensitive fields)
	const eventData = {
		id: event.id,
		name: event.name,
		subtitle: event.subtitle,
		description: event.description,
		type: event.type,
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		maxAttendees: event.maxAttendees,
		numAttendees: event.numAttendees,
		eventFor: event.eventFor,
		showAttendeeList: event.showAttendeeList,
	}

	return json(eventData)
}
