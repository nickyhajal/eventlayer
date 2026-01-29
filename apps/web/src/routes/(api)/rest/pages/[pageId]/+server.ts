import { error, json } from '@sveltejs/kit'
import { getCorsHeaders, validateApiKey } from '$lib/server/rest/auth'

import { EventFns } from '@matterloop/api'

import type { RequestHandler } from './$types'
import { uuid } from '@matterloop/util'

// Handle CORS preflight
export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(),
	})
}

// GET /rest/pages/:pageId - Returns a single page by ID or path
export const GET: RequestHandler = async ({ request, params }) => {
	const corsHeaders = getCorsHeaders()

	const { event } = await validateApiKey(request)

	const eventFns = EventFns(event.id)
	const { pageId } = params

	// Try to find by ID first, then by path
	let page

	// if (uuid.validate(pageId)) {
	// 	page = await eventFns.getPageById(pageId)
	// }

	if (!page) {
		// Try by path (with or without leading slash)
		const path = pageId.startsWith('/') ? pageId : `/${pageId}`
		page = await eventFns.getPageByPath(path)

		// Also try without leading slash if that didn't work
		if (!page) {
			page = await eventFns.getPageByPath(pageId)
		}
	}

	if (!page) {
		throw error(404, {
			message: 'Page not found',
		})
	}

	// Only return published pages
	if (page.status !== 'published') {
		throw error(404, {
			message: 'Page not found',
		})
	}

	return json(
		{
			data: {
				id: page.id,
				path: page.path,
				title: page.title,
				subtitle: page.subtitle,
				body: page.body,
				ord: page.ord,
				createdAt: page.createdAt,
				updatedAt: page.updatedAt,
			},
		},
		{
			headers: corsHeaders,
		},
	)
}
