import { json } from '@sveltejs/kit'
import { PUBLIC_MEDIA_URL } from '$env/static/public'
import { getCorsHeaders, validateApiKey } from '$lib/server/rest/auth'
import { applyQueryToArray, parseQueryParams } from '$lib/server/rest/query'

import { EventFns } from '@matterloop/api'
import type { Media } from '@matterloop/db'

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
