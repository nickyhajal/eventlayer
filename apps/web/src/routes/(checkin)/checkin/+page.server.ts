// routes/login/+page.server.ts

import { EventFns } from '@matterloop/api'

export const load = async ({ locals }) => {
	const eventFns = EventFns({ eventId: locals.event.id })
	const users = await eventFns.getUsers()
	const stats = await eventFns.getCheckinStats()
	return {
		users,
		stats,
	}
}
