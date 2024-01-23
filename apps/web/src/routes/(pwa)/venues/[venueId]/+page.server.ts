import { redirect } from '@sveltejs/kit'
import { EventFns } from '$lib/server/models/event/eventFns.js'
import { VenueFns } from '$lib/server/models/event/venueFns.js'

export const load = async (req) => {
	const { locals, url, params } = req
	const venueFns = VenueFns({ venueId: params.venueId })
	return {
		venue: await venueFns.get(),
	}
}
