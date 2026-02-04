import { EventFns } from '@matterloop/api'

export const load = async ({ locals }) => {
	if (!locals.event?.id) {
		return { event: null }
	}
	const eventFns = EventFns({ eventId: locals.event.id })
	const event = await eventFns.get()
	return { event }
}
