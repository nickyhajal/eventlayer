import { error, json } from '@sveltejs/kit'

import {
	and,
	asc,
	count,
	db,
	desc,
	eq,
	eventApiKeyTable,
	eventMetaTable,
	eventTable,
	inArray,
	or,
} from '@matterloop/db'
import { dayjs } from '@matterloop/util'

import { getPaginationMeta, parseFilters, parseRestQuery } from '$lib/server/restUtils'

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

	const { event: mainEvent } = validation

	// Parse query parameters
	const query = parseRestQuery(url)
	const filters = parseFilters(url)

	// Build where conditions
	const whereConditions: any[] = [
		or(eq(eventTable.id, mainEvent.id), eq(eventTable.eventId, mainEvent.id)),
	]

	// Add direct field filters
	if (filters.fields.type) {
		whereConditions.push(eq(eventTable.type, filters.fields.type))
	}
	if (filters.fields.eventFor) {
		whereConditions.push(eq(eventTable.eventFor, filters.fields.eventFor))
	}

	// Handle event_meta filters
	let eventIdsFromMeta: string[] | null = null
	if (Object.keys(filters.meta).length > 0) {
		// Query event_meta table for matching metadata
		const metaConditions = Object.entries(filters.meta).map(([key, value]) =>
			and(eq(eventMetaTable.key, key), eq(eventMetaTable.value, value)),
		)

		const matchingMeta = await db
			.select({ eventId: eventMetaTable.eventId })
			.from(eventMetaTable)
			.where(or(...metaConditions))

		eventIdsFromMeta = [...new Set(matchingMeta.map((m) => m.eventId))]

		// If no events match the meta filter, return empty result
		if (eventIdsFromMeta.length === 0) {
			return json({
				events: [],
				pagination: getPaginationMeta(0, query.limit, query.offset),
			})
		}

		whereConditions.push(inArray(eventTable.id, eventIdsFromMeta))
	}

	// Get total count
	const [{ count: totalCount }] = await db
		.select({ count: count() })
		.from(eventTable)
		.where(and(...whereConditions))

	// Build order by
	const orderBy: any[] = []
	if (query.sortBy) {
		const sortField = query.sortBy as keyof typeof eventTable
		const sortFn = query.sortOrder === 'desc' ? desc : asc

		// Map sortBy to actual table columns
		const validSortFields = [
			'name',
			'startsAt',
			'endsAt',
			'type',
			'createdAt',
			'updatedAt',
			'ord',
		]
		if (validSortFields.includes(query.sortBy)) {
			orderBy.push(sortFn(eventTable[sortField]))
		}
	} else {
		// Default sort by startsAt ascending
		orderBy.push(asc(eventTable.startsAt))
	}

	// Query events with pagination
	const events = await db.query.eventTable.findMany({
		where: and(...whereConditions),
		orderBy,
		limit: query.limit,
		offset: query.offset,
		with: {
			eventMeta: true,
			venue: true,
		},
	})

	// Format event data (excluding sensitive fields)
	const eventsData = events.map((event) => ({
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
		ord: event.ord,
		venue: event.venue
			? {
					id: event.venue.id,
					name: event.venue.name,
					description: event.venue.description,
				}
			: null,
		meta: event.eventMeta
			? event.eventMeta.reduce(
					(acc, meta) => {
						if (meta.key) {
							acc[meta.key] = meta.value || ''
						}
						return acc
					},
					{} as Record<string, string>,
				)
			: {},
	}))

	return json({
		events: eventsData,
		pagination: getPaginationMeta(totalCount, query.limit, query.offset),
	})
}
