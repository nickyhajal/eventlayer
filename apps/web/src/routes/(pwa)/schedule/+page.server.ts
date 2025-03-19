import { EventFns } from '@matterloop/api'
import { orderBy } from '@matterloop/util'

export const load = async (req) => {
	const { locals, url } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	const events = await eventFns.getEvents({ type: 'program' })
	const myEvents = await eventFns.getUserEvents(locals.me)
	return {
		events: orderBy([...events, ...myEvents], ['startsAt']),
	}
}
