// routes/login/+page.server.ts
import { db, eq, sponsorTable } from '@matterloop/db'
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
	if (!params.sponsorId) {
		return error(404, 'No sponsor id')
	}
	const sponsor = await db.query.sponsorTable.findFirst({
		where: eq(sponsorTable.id, params.sponsorId),
		with: { photo: true, users: { with: { user: true } } },
	})
	if (!sponsor) {
		return error(404, 'Sponsor not found')
	}
	return { sponsor }
}
