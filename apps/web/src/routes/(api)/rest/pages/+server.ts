import { json } from '@sveltejs/kit'
import { getCorsHeaders, validateApiKey } from '$lib/server/rest/auth'
import { applyQueryToArray, parseQueryParams } from '$lib/server/rest/query'

import { EventFns } from '@matterloop/api'

import type { RequestHandler } from './$types'

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(),
	})
}

// GET /rest/pages - Returns all pages for the event
export const GET: RequestHandler = async ({ request, url }) => {
	const corsHeaders = getCorsHeaders()

	const { event } = await validateApiKey(request)

	// Parse query parameters
	const query = parseQueryParams(url, {
		allowedFilters: ['type'],
		allowedOrderBy: ['ord', 'title', 'createdAt', 'updatedAt'],
		defaultOrderBy: 'ord',
		defaultOrder: 'asc',
		maxLimit: 100,
	})

	const eventFns = EventFns(event.id)
	const pages = await eventFns.getPages()

	// Filter out unpublished pages and format response
	const formattedPages = pages
		.filter((page) => page.status === 'published')
		.map((page) => ({
			id: page.id,
			path: page.path,
			title: page.title,
			subtitle: page.subtitle,
			body: page.body,
			type: page.type,
			ord: page.ord,
			createdAt: page.createdAt,
			updatedAt: page.updatedAt,
		}))

	// Apply filtering, ordering, and pagination
	const { data, meta } = applyQueryToArray(formattedPages, query)

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
