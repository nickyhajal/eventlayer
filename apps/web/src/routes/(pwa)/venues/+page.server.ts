import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	const venues = await eventFns.getVenues()
	return {
		venues,
	}
}
