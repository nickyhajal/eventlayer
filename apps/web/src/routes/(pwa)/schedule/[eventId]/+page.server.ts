import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url, params } = req
	const eventFns = EventFns({ eventId: params.eventId, mainEventId: locals.event.id })
	return {
		event: await eventFns.get(),
		users: await eventFns.getUsers(),
	}
}
