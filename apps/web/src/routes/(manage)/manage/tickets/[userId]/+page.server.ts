// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import QRCode from 'qrcode'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { EventFns, VenueFns } from '@matterloop/api'

const schema = z.object({
	email: z.string().email(),
	password: z.string(),
})

export const load = async ({ locals, params, url }) => {
	if (!params.userId) {
		return error(404, 'No user id')
	}
	const eventFns = EventFns({ eventId: locals.event.id })
	const user = await eventFns.getUser(params.userId)
	if (!user) {
		return error(404, 'User not found')
	}

	const qrcode = await QRCode.toDataURL(`${url.protocol}://${url.host}/user/${user.id}`, {
		width: 320,
	})
	return { user, qrcode }
}
