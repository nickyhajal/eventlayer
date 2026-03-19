import { error, redirect } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
	const { locals, params } = req
	const eventFns = EventFns({ eventId: locals.event.id })
	const sponsor = await eventFns.getSponsor(params.sponsorId)

	if (!sponsor) {
		throw error(404, 'Sponsor not found')
	}

	if (locals.me?.id) {
		const isHearted = Boolean(await eventFns.getSponsorHeart(params.sponsorId, locals.me.id))
		throw redirect(
			302,
			isHearted ? `/sponsors/${params.sponsorId}` : `/sponsors/${params.sponsorId}?heart=1&source=qr`,
		)
	}

	return {
		sponsor,
	}
}
