import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url } = req
	if (locals?.event?.id) {
		const eventFns = EventFns({ eventId: locals.event.id })
		return {
			upcoming: await eventFns.getNextEvents(),
		}
	}
	return {}
}
