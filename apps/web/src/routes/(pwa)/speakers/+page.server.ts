import { redirect } from '@sveltejs/kit'
import { EventFns } from '$lib/server/models/event/eventFns.js'

export const load = async (req) => {
	const { locals, url } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	const users = await eventFns.getSubEventSpecialUsers()
	return {
		users,
	}
}
