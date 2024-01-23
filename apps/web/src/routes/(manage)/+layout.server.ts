import { EventFns } from '$lib/server/models/event/eventFns.js'

export const load = async (req) => {
	const eventFns = EventFns({ eventId: req.locals.event.id })
	const event = await eventFns.get()
	return {
		me: req.locals.me ? req.locals.me : null,
		event: req.locals.event ? req.locals.event : null,
		venues: await eventFns.getVenues(),
	}
}
