import { and, db, eq, eventTable, eventUserTable } from '@matterloop/db'

interface Args {
	eventId: string
	load?: boolean
}

export const EventFns = (eventId: string) => ({
	getUsers: async () => {
		console.log('get users')
		const users = await db.query.eventUserTable.findMany({
			where: and(eq(eventUserTable.eventId, eventId)),
		})
		return users
	},
	getEvents: async () => {
		const users = await db.query.eventTable.findMany({
			where: and(eq(eventTable.eventId, eventId)),
		})
	},
})
