// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { EventFns } from '$lib/server/models/event/eventFns.js'
import { VenueFns } from '$lib/server/models/event/venueFns.js'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

const schema = z.object({
	email: z.string().email(),
	password: z.string(),
})

export const load = async ({ locals, params }) => {
	if (!params.venueId) {
		throw error(404, 'No venue id')
	}
	const venue = await VenueFns({ venueId: params.venueId, eventId: locals.event.id }).get()
	if (!venue) {
		throw error(404, 'Venue not found')
	}
	return { venue }
}
