// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'

import { db, eq, eventTicketTable } from '@matterloop/db'

export const load = async ({ locals }) => {
	if (!locals.event.id) {
		error(404, 'Event not found')
	}
	const tickets = await db.query.eventTicketTable.findMany({
		where: eq(eventTicketTable.eventId, locals.event.id),
		with: {
			user: true,
		},
	})
	return { tickets }
}
