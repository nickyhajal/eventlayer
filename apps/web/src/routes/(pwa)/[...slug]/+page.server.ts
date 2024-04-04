import { error, redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, params, url } = req
	const slug = params.slug
	if (locals.event?.id) {
		const eventFns = await EventFns({ eventId: locals.event.id })
		const page = await eventFns.getPageByPath(slug)
		if (page) {
			return {
				page,
			}
		}
	}
	return error(404, 'Page not found')
}
