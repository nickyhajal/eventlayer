// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { EventFns, FormFns } from '@matterloop/api'

const schema = z.object({
	email: z.string().email(),
	password: z.string(),
})

export const load = async ({ locals, params }) => {
	if (!params.pageId) {
		return error(404, 'No form id')
	}
	const eventFns = await EventFns({ eventId: locals.event.id })
	const page = await eventFns.getPageById(params.pageId)
	if (!page) {
		return error(404, 'Page not found')
	}
	return { page }
}
