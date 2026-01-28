import { json } from '@sveltejs/kit'
import { PUBLIC_MEDIA_URL } from '$env/static/public'
import { getCorsHeaders, validateApiKey } from '$lib/server/rest/auth'
import { applyQueryToArray, parseQueryParams } from '$lib/server/rest/query'

import { EventFns } from '@matterloop/api'
import {
	and,
	asc,
	db,
	eq,
	eventUserFieldTable,
	eventUserInfoTable,
	inArray,
	type Media,
} from '@matterloop/db'
import { groupBy } from '@matterloop/util'

import type { RequestHandler } from './$types'

// Helper to construct media URL
function getMediaUrl(media: Media | null | undefined, transforms = ''): string | null {
	if (!media) return null
	const path = media.path || 'submissions'
	const ext = media.ext || 'jpg'
	const version = media.version || 0
	const base = PUBLIC_MEDIA_URL
	const transformPath = transforms ? `/tr:${transforms}` : ''
	return `${base}${transformPath}/${media.dir}/${path}/${media.id}-${version}.${ext}?v=${media.version}`
}

// Handle CORS preflight
export const OPTIONS: RequestHandler = async ({ request }) => {
	const origin = request.headers.get('origin')
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(origin),
	})
}

// GET /rest/users - Returns all attendees for the event with user info and avatar
export const GET: RequestHandler = async ({ request, url }) => {
	const origin = request.headers.get('origin')
	const corsHeaders = getCorsHeaders(origin)

	const { event } = await validateApiKey(request)

	// Parse query parameters
	const query = parseQueryParams(url, {
		allowedFilters: ['type'],
		allowedOrderBy: ['firstName', 'lastName', 'createdAt', 'company', 'type'],
		defaultOrderBy: 'lastName',
		defaultOrder: 'asc',
		maxLimit: 500,
	})

	const eventFns = EventFns(event.id)
	const users = await eventFns.getUsers()

	// Fetch public custom fields for this event
	const customFieldDefs = await db.query.eventUserFieldTable.findMany({
		where: and(
			eq(eventUserFieldTable.eventId, event.id),
			eq(eventUserFieldTable.visibility, 'public'),
		),
		orderBy: [asc(eventUserFieldTable.ord)],
	})

	// Fetch user info for all users if there are custom fields
	let userInfoByUserId: Record<string, Record<string, string>> = {}
	if (customFieldDefs.length > 0 && users.length > 0) {
		const userIds = users.map((u) => u.userId).filter(Boolean) as string[]
		if (userIds.length > 0) {
			const userInfo = await db.query.eventUserInfoTable.findMany({
				where: and(
					eq(eventUserInfoTable.eventId, event.id),
					inArray(eventUserInfoTable.userId, userIds),
				),
			})
			// Group by userId and create key-value maps
			const grouped = groupBy(userInfo, 'userId')
			for (const [userId, infos] of Object.entries(grouped)) {
				userInfoByUserId[userId] = {}
				for (const info of infos) {
					if (info.key) {
						userInfoByUserId[userId][info.key] = info.value || ''
					}
				}
			}
		}
	}

	// Helper to get custom fields for a user based on scope
	function getCustomFieldsForUser(userId: string, userType: string | null) {
		const result: Record<string, string | null> = {}
		const userInfo = userInfoByUserId[userId] || {}

		for (const field of customFieldDefs) {
			// Check if field applies to this user
			let applies = false
			if (field.scope === 'all') {
				applies = true
			} else if (field.scope === 'user' && field.scopeValue === userId) {
				applies = true
			} else if (field.scope === 'type' && field.scopeValue === userType) {
				applies = true
			}

			if (applies) {
				result[field.key] = userInfo[field.key] || null
			}
		}
		return result
	}

	// Format users for API response
	const formattedUsers = users.map((user) => ({
		id: user.userId,
		eventUserId: user.id,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		type: user.type,
		title: user.title,
		company: user.company,
		bio: user.bio,
		avatar: getMediaUrl(user.photo, 'w-400'),
		avatarLarge: getMediaUrl(user.photo, 'w-800'),
		linkedinUrl: user.linkedinUrl,
		twitterUrl: user.twitterUrl,
		websiteUrl: user.websiteUrl,
		createdAt: user.createdAt,
		// Include custom fields only if there are public custom field definitions
		...(customFieldDefs.length > 0 && {
			customFields: getCustomFieldsForUser(user.userId || '', user.type),
		}),
	}))

	// Apply filtering, ordering, and pagination
	const { data, meta } = applyQueryToArray(formattedUsers, query)

	return json(
		{
			data,
			meta: {
				...meta,
				eventId: event.id,
				eventName: event.name,
			},
		},
		{
			headers: corsHeaders,
		},
	)
}
