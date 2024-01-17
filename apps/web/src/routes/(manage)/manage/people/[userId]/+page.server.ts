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
	if (!params.userId) {
		throw error(404, 'No user id')
	}
	const eventFns = EventFns({ eventId: locals.event.id })
	const user = eventFns.getUser(params.userId)
	if (!user) {
		throw error(404, 'User not found')
	}
	return { user }
}
