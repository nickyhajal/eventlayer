// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { EventFns } from '$lib/server/models/event/eventFns.js'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

const schema = z.object({
	email: z.string().email(),
	password: z.string(),
})

export const load = async ({ locals, params }) => {
	if (!params.eventId) {
		return error(404, 'No event id')
	}
	const event = await EventFns(params.eventId).get()
	if (!event) {
		return error(404, 'Event not found')
	}
	return { event }
}
