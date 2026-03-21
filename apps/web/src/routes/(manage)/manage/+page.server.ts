import { error } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { db, eq, eventTicketTable } from '@matterloop/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.event?.id) {
		error(404, 'Event not found')
	}

	const eventId = locals.event.id
	const eventFns = EventFns({ eventId })

	const [users, events, sponsors, tickets, checkinStats] = await Promise.all([
		eventFns.getUsersWithInfo(),
		eventFns.getEvents(),
		eventFns.getSponsors(),
		db.query.eventTicketTable.findMany({
			where: eq(eventTicketTable.eventId, eventId),
		}),
		eventFns.getCheckinStats(),
	])

	const typeCounts: Record<string, number> = {}
	const onboardCounts = { sent: 0, done: 0, notSent: 0 }

	for (const user of users) {
		const type = user.type || 'other'
		typeCounts[type] = (typeCounts[type] || 0) + 1

		if (user.onboardStatus === 'done') onboardCounts.done++
		else if (user.onboardStatus === 'pending' || user.onboardStatus === 'sent') onboardCounts.sent++
		else onboardCounts.notSent++
	}

	const userTypeCounts = Object.entries(typeCounts)
		.map(([type, count]) => ({ type, count }))
		.sort((a, b) => b.count - a.count)

	const assignedTickets = tickets.filter((ticket) => ticket.assignedTo).length
	const unassignedTickets = tickets.length - assignedTickets

	return {
		stats: {
			totalUsers: users.length,
			userTypeCounts,
			totalEvents: events.length,
			totalSponsors: sponsors.length,
			totalTickets: tickets.length,
			claimedTickets: assignedTickets,
			unclaimedTickets: unassignedTickets,
			onboardCounts,
			attendees: users.length,
			assignedTickets,
			unassignedTickets,
			onboardingCompleted: onboardCounts.done,
			checkinsCompleted: checkinStats.checkedInIds.length,
		},
	}
}
