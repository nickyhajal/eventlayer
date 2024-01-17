import { and, asc, db, eq, eventTable, eventUserTable, venueTable } from '@matterloop/db'

interface Args {
	eventId: string
	venueId: string
}

export const VenueFns = ({ venueId, eventId }: Args) => ({
	get: async () => {
		const event = await db.query.venueTable.findFirst({
			where: and(eq(venueTable.id, venueId)),
			with: { events: true, photo: true },
		})
		return event
	},
	getEvents: async () => {
		const events = await db.query.eventTable.findMany({
			where: and(eq(eventTable.venueId, venueId), eq(eventTable.eventId, eventId)),
		})
		return events
	},
})
