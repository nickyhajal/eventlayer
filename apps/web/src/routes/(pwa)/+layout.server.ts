import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'

export const load = async (req) => {
	if (req?.locals?.event?.id) {
		const eventFns = EventFns({ eventId: req.locals.event.id })
		const event = await eventFns.get()
		if (event?.id && req?.locals?.me?.onboardStatus !== 'done' && req.url.pathname !== '/welcome') {
			const form = await eventFns.getOnboardForm()
			if (form) {
				redirect(303, '/welcome')
			}
		}
		return {
			me: req.locals.me ? req.locals.me : null,
			event: event,
		}
	}
	return {}
}
