import { redirect } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, url, params } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	return {
		sponsor: await eventFns.getSponsor(params.sponsorId),
	}
}
