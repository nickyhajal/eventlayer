import { redirect } from '@sveltejs/kit'
import { EventFns } from '$lib/server/models/event/eventFns.js'

export const load = async (req) => {
	const { locals, url, params } = req
	const eventFns = EventFns({ eventId: params.eventId })
	return {
		event: await eventFns.get(),
		users: await eventFns.getUsers(),
	}
}
