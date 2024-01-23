import { and, asc, db, eq, eventTable, eventUserTable, mediaTable, userTable } from '@matterloop/db'
import { omit } from '@matterloop/util'

interface Args {
	eventId: string
	load?: boolean
}

export const EventFns = (args: string | Args) => {
	const eventId = typeof args === 'string' ? args : args.eventId
	return {
		get: async () => {
			const event = await db.query.eventTable.findFirst({
				where: and(eq(eventTable.id, eventId)),
				with: { users: { with: { user: true } }, photo: true, venue: true },
			})
			return event
		},
		getUsers: async () => {
			const userRows = await db
				.select()
				.from(eventUserTable)
				.where(and(eq(eventUserTable.eventId, eventId)))
				.leftJoin(userTable, eq(userTable.id, eventUserTable.userId))
				.leftJoin(mediaTable, eq(mediaTable.id, userTable.mediaId))
			if (userRows.length) {
				return userRows.map((user) => {
					return {
						...user.auth_user,
						...user.event_user,
					}
				})
			}
			return []
		},
		getUser: async (userId: string) => {
			const userRows = await db
				.select()
				.from(eventUserTable)
				.where(and(eq(eventUserTable.eventId, eventId), eq(eventUserTable.id, userId)))
				.leftJoin(userTable, eq(userTable.id, eventUserTable.userId))
				.leftJoin(mediaTable, eq(mediaTable.id, userTable.mediaId))
			if (userRows.length) {
				const user = userRows[0]
				return {
					...user.auth_user,
					...user.event_user,
					photo: user.media,
				}
			}
		},
		getEvents: async () => {
			const events = await db.query.eventTable.findMany({
				where: and(eq(eventTable.eventId, eventId)),
				orderBy: asc(eventTable.startsAt),
			})
			return events
		},
		getVenues: async () => {
			const venues = await db.query.venueTable.findMany({
				where: and(eq(eventTable.eventId, eventId)),
				with: { parent: true, children: true, photo: true },
			})
			return venues
		},
		getContent: async () => {
			const content = await db.query.contentTable.findMany({
				where: and(eq(eventTable.eventId, eventId)),
			})
			return content
		},
	}
}
