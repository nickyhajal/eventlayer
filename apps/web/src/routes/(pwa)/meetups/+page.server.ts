import { EventFns } from '@matterloop/api'
import { orderBy, uniqBy } from '@matterloop/util'

export const load = async (req) => {
	const { locals, url } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	const events = await eventFns.getEvents({ type: 'meetup' })
	const myEvents = await eventFns.getUserEvents(locals.me)
	return {
		events: uniqBy(orderBy([...events, ...myEvents], ['startsAt']), 'id'),
	}
}
