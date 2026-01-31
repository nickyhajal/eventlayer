import { error } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { db, eq, eventTicketTable } from '@matterloop/db'

export const load = async ({ locals }) => {
	if (!locals.event.id) {
		error(404, 'Event not found')
	}
	const eventId = locals.event.id
	const eventFns = EventFns({ eventId })

	const [users, events, sponsors, tickets] = await Promise.all([
		eventFns.getUsersWithInfo(),
		eventFns.getEvents(),
		eventFns.getSponsors(),
		db.query.eventTicketTable.findMany({
			where: eq(eventTicketTable.eventId, eventId),
		}),
	])

	const typeCounts: Record<string, number> = {}
	const onboardCounts = { sent: 0, done: 0, notSent: 0 }

	for (const u of users) {
		const t = u.type || 'other'
		typeCounts[t] = (typeCounts[t] || 0) + 1
		if (u.onboardStatus === 'done') onboardCounts.done++
		else if (u.onboardStatus === 'pending' || u.onboardStatus === 'sent')
			onboardCounts.sent++
		else onboardCounts.notSent++
	}

	const userTypeCounts = Object.entries(typeCounts)
		.map(([type, count]) => ({ type, count }))
		.sort((a, b) => b.count - a.count)

	const claimedTickets = tickets.filter((t) => t.assignedTo).length

	return {
		stats: {
			totalUsers: users.length,
			userTypeCounts,
			totalEvents: events.length,
			totalSponsors: sponsors.length,
			totalTickets: tickets.length,
			unclaimedTickets: tickets.length - claimedTickets,
			claimedTickets,
			onboardCounts,
		},
	}
}
