// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { EventFns } from '$lib/server/models/event/eventFns.js'
import { z } from 'zod'

export const load = async ({ locals }) => {
	if (!locals.event.id) {
		error(404, 'Event not found')
	}
	const eventFns = EventFns({ eventId: locals.event.id })
	return { users: await eventFns.getUsers() }
}
