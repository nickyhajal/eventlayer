import { error, json } from '@sveltejs/kit'

import {
	and,
	asc,
	count,
	db,
	desc,
	eq,
	eventApiKeyTable,
	eventTable,
	eventUserInfoTable,
	eventUserTable,
	inArray,
	or,
	userTable,
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

	const { event } = validation

	// Parse query parameters
	const query = parseRestQuery(url)
	const filters = parseFilters(url)

	// Build where conditions
	const whereConditions: any[] = [eq(eventUserTable.eventId, event.id)]

	// Add direct field filters
	if (filters.fields.type) {
		whereConditions.push(eq(eventUserTable.type, filters.fields.type))
	}
	if (filters.fields.status) {
		whereConditions.push(eq(eventUserTable.status, filters.fields.status))
	}

	// Handle event_user_info metadata filters
	let userIdsFromMeta: string[] | null = null
	if (Object.keys(filters.meta).length > 0) {
		// Query event_user_info table for matching metadata
		const metaConditions = Object.entries(filters.meta).map(([key, value]) =>
			and(
				eq(eventUserInfoTable.key, key),
				eq(eventUserInfoTable.value, value),
				eq(eventUserInfoTable.eventId, event.id),
			),
		)

		const matchingMeta = await db
			.select({ userId: eventUserInfoTable.userId })
			.from(eventUserInfoTable)
			.where(or(...metaConditions))

		userIdsFromMeta = [...new Set(matchingMeta.map((m) => m.userId).filter((id) => id !== null))]

		// If no users match the meta filter, return empty result
		if (userIdsFromMeta.length === 0) {
			return json({
				users: [],
				pagination: getPaginationMeta(0, query.limit, query.offset),
			})
		}

		whereConditions.push(inArray(eventUserTable.userId, userIdsFromMeta))
	}

	// Get total count
	const [{ count: totalCount }] = await db
		.select({ count: count() })
		.from(eventUserTable)
		.where(and(...whereConditions))

	// Build order by
	const orderBy: any[] = []
	if (query.sortBy) {
		const sortFn = query.sortOrder === 'desc' ? desc : asc

		// Map sortBy to actual table columns
		const validEventUserFields = ['type', 'status', 'company', 'title', 'createdAt']
		const validUserFields = ['firstName', 'lastName', 'email']

		if (validEventUserFields.includes(query.sortBy)) {
			const sortField = query.sortBy as keyof typeof eventUserTable
			orderBy.push(sortFn(eventUserTable[sortField]))
		} else if (validUserFields.includes(query.sortBy)) {
			const sortField = query.sortBy as keyof typeof userTable
			orderBy.push(sortFn(userTable[sortField]))
		}
	} else {
		// Default sort by lastName, firstName ascending
		orderBy.push(asc(userTable.lastName), asc(userTable.firstName))
	}

	// Query event users with pagination
	const eventUsers = await db.query.eventUserTable.findMany({
		where: and(...whereConditions),
		orderBy,
		limit: query.limit,
		offset: query.offset,
		with: {
			user: {
				with: {
					photo: true,
				},
			},
			eventUserInfo: true,
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
		url: eu.url,
		photo: eu.user.photo
			? {
					id: eu.user.photo.id,
					url: eu.user.photo.url,
				}
			: null,
		meta: eu.eventUserInfo
			? eu.eventUserInfo.reduce(
					(acc, info) => {
						if (info.key && info.public) {
							acc[info.key] = info.value || ''
						}
						return acc
					},
					{} as Record<string, string>,
				)
			: {},
	}))

	return json({
		users: usersData,
		pagination: getPaginationMeta(totalCount, query.limit, query.offset),
	})
}
