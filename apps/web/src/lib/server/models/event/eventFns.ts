import { alias } from 'drizzle-orm/pg-core'

import {
	and,
	asc,
	db,
	eq,
	eventTable,
	eventUserTable,
	gt,
	isNotNull,
	mediaTable,
	ne,
	sponsorTable,
	userTable,
	venueTable,
} from '@matterloop/db'
import { dayjs, keyBy, omit, orderBy } from '@matterloop/util'

interface Args {
	eventId: string
	mainEventId?: string
	load?: boolean
}

export const EventFns = (args: string | Args) => {
	const eventId = typeof args === 'string' ? args : args.eventId
	const mainEventId = (typeof args === 'string' ? args : args.mainEventId) || undefined
	return {
		get: async () => {
			const event = await db.query.eventTable.findFirst({
				where: and(eq(eventTable.id, eventId)),
				with: { users: { with: { user: true } }, photo: true, venue: true },
			})
			return event
		},
		getNextEvents: async () => {
			return db.query.eventTable.findMany({
				where: and(eq(eventTable.eventId, eventId), gt(eventTable.startsAt, dayjs().toISOString())),
				orderBy: asc(eventTable.startsAt),
				with: { photo: true, venue: true },
				limit: 3,
			})
		},
		getUsers: async () => {
			const usersQuery = db
				.select()
				.from(eventUserTable)
				.where(and(eq(eventUserTable.eventId, eventId)))
				.leftJoin(userTable, eq(userTable.id, eventUserTable.userId))
				.leftJoin(mediaTable, eq(mediaTable.id, userTable.mediaId))
			if (mainEventId) {
				const mainEventUser = alias(eventUserTable, 'mainEventUser')
				usersQuery.leftJoin(
					mainEventUser,
					and(
						eq(eventUserTable.userId, mainEventUser.userId),
						eq(mainEventUser.eventId, mainEventId),
					),
				)
			}
			const userRows = await usersQuery
			if (userRows.length) {
				return userRows.map((user) => {
					console.log(user)
					return {
						photo: user.media,
						...user.auth_user,
						...user.event_user,
						...user.mainEventUser,
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
				with: {
					photo: true,
					venue: { with: { photo: true } },
					users: { with: { user: { with: { photo: true } } } },
				},
				orderBy: asc(eventTable.startsAt),
			})
			return events
		},
		getUserEvents: async (userId: string) => {
			const user = await db.query.eventUserTable.findFirst({
				where: and(eq(eventUserTable.id, userId), eq(eventUserTable.eventId, eventId)),
			})
			if (user?.userId) {
				return db.query.eventUserTable.findMany({
					where: and(
						eq(eventUserTable.userId, user.userId),
						eq(eventUserTable.mainId, eventId),
						isNotNull(eventUserTable.mainId),
					),
					with: { event: true },
				})
			}
			return []
		},
		getVenues: async () => {
			const venues = await db.query.venueTable.findMany({
				where: and(eq(eventTable.eventId, eventId)),
				with: { parent: true, children: true, photo: true },
				orderBy: asc(venueTable.ord),
			})
			return venues
		},
		getSponsors: async () => {
			const sponsors = await db.query.sponsorTable.findMany({
				where: and(eq(sponsorTable.eventId, eventId)),
				with: { photo: true, users: { with: { user: { with: { photo: true } } } } },
				orderBy: asc(sponsorTable.title),
			})
			return sponsors
		},
		getContent: async () => {
			const content = await db.query.contentTable.findMany({
				where: and(eq(eventTable.eventId, eventId)),
			})
			return content
		},
		getSubEventSpecialUsers: async () => {
			const mainEventUser = alias(eventUserTable, 'mainEventUser')
			const userAlias = alias(userTable, 'user')
			const users = await db
				.selectDistinctOn([eventUserTable.userId])
				.from(eventUserTable)
				.leftJoin(eventTable, eq(eventUserTable.eventId, eventTable.id))
				.leftJoin(userAlias, eq(eventUserTable.userId, userAlias.id))
				.leftJoin(mediaTable, eq(userAlias.mediaId, mediaTable.id))
				.leftJoin(
					mainEventUser,
					and(eq(eventUserTable.userId, mainEventUser.userId), eq(mainEventUser.eventId, eventId)),
				)
				.where(and(eq(eventTable.eventId, eventId), ne(eventUserTable.type, 'attendee')))
			return orderBy(users, ['user.lastName', 'user.firstName'], ['asc', 'asc'])
		},
	}
}
