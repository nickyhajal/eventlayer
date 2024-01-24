import { redirect } from '@sveltejs/kit'
import { EventFns } from '$lib/server/models/event/eventFns.js'
import { VenueFns } from '$lib/server/models/event/venueFns.js'

export const load = async (req) => {
	const { locals, url, params } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	return {
		user: await eventFns.getUser(params.userId),
	}
}
