import { redirect } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url, params } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	const events = await eventFns.getUserEvents(params.userId)
	console.log('eventFns', events)
	return {
		user: await eventFns.getUser(params.userId),
		events: await eventFns.getUserEvents(params.userId),
	}
}
