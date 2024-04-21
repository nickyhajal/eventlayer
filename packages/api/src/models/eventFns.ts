import {
	alias,
	and,
	asc,
	contentTable,
	db,
	eq,
	eventTable,
	eventUserInfoTable,
	eventUserTable,
	formTable,
	gt,
	inArray,
	isNotNull,
	mediaTable,
	menuTable,
	ne,
	or,
	pageTable,
	sponsorTable,
	userTable,
	venueTable,
} from '@matterloop/db'
import { dayjs, groupBy, keyBy, omit, orderBy } from '@matterloop/util'

interface Args {
	eventId: string
	mainEventId?: string
	load?: boolean
}

export const EventFns = (args: string | Args) => {
	const eventId = typeof args === 'string' ? args : args.eventId
	const mainEventId = (typeof args === 'string' ? args : args.mainEventId) || undefined
	const fns = {
		get: async () => {
			const event = await db.query.eventTable.findFirst({
				where: and(eq(eventTable.id, eventId)),
				with: {
					users: {
						with: { user: true },
					},
					photo: true,
					venue: true,
					favicon: true,
					largeLogo: true,
					menus: { orderBy: asc(menuTable.ord) },
					content: { where: and(eq(contentTable.eventId, eventId), ne(contentTable.type, 'faq')) },
				},
			})
			if (event?.content) {
				return {
					...event,
					contentByKey: keyBy(event.content, 'key'),
				}
			}
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
				.where(and(eq(eventUserTable.eventId, eventId), eq(eventUserTable.status, 'active')))
				.leftJoin(userTable, eq(userTable.id, eventUserTable.userId))
				.leftJoin(mediaTable, eq(mediaTable.id, userTable.mediaId))
			// .leftJoin(eventUserInfoTable, eq(eventUserInfoTable.id, userTable.id))
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
		getUsersWithInfo: async () => {
			const users = await fns.getUsers()
			const ids = users.map((user) => user.userId)
			const info = await db.query.eventUserInfoTable.findMany({
				where: and(
					inArray(eventUserInfoTable.userId, ids),
					eq(eventUserInfoTable.eventId, eventId),
				),
			})
			const infoByUserId = groupBy(info, 'userId')
			return users.map((user) => {
				return {
					...user,
					info: keyBy(infoByUserId[user.userId], 'key'),
				}
			})
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
				const infoRows = await db.query.eventUserInfoTable.findMany({
					where: and(
						eq(eventUserInfoTable.eventId, eventId),
						eq(eventUserInfoTable.userId, user?.auth_user.id),
					),
				})
				return {
					...user.auth_user,
					...user.event_user,
					photo: user.media,
					info: keyBy(infoRows, 'key'),
				}
			}
		},
		getSponsor: async (sponsorId: string) => {
			const sponsor = await db.query.sponsorTable.findFirst({
				where: and(eq(sponsorTable.eventId, eventId), eq(sponsorTable.id, sponsorId)),
				with: { photo: true, users: { with: { user: { with: { photo: true } } } } },
				orderBy: asc(sponsorTable.ord),
			})
			return sponsor
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
				orderBy: [asc(sponsorTable.ord), asc(sponsorTable.title)],
			})
			return sponsors
		},
		getContent: async () => {
			const content = await db.query.contentTable.findMany({
				where: and(eq(contentTable.eventId, eventId), ne(contentTable.type, 'faq')),
				orderBy: asc(contentTable.ord),
			})
			return content
		},
		getFaqs: async () => {
			const content = await db.query.contentTable.findMany({
				where: and(eq(contentTable.eventId, eventId), eq(contentTable.type, 'faq')),
			})
			return content
		},
		getPages: async () => {
			const rows = await db.query.pageTable.findMany({
				where: and(eq(contentTable.eventId, eventId)),
			})
			return rows
		},
		getPageByPath: async (path: string) => {
			const row = await db.query.pageTable.findFirst({
				where: and(eq(pageTable.eventId, eventId), eq(pageTable.path, path)),
			})
			return row
		},
		getPageById: async (id: string) => {
			const row = await db.query.pageTable.findFirst({
				where: and(eq(pageTable.eventId, eventId), eq(pageTable.id, id)),
			})
			return row
		},
		getForms: async () => {
			const rows = await db.query.formTable.findMany({
				where: eq(formTable.eventId, eventId),
			})
			return rows
		},
		getOnboardForm: async () => {
			const rows = await db.query.formTable.findMany({
				where: and(eq(formTable.eventId, eventId), eq(formTable.type, 'onboarding')),
			})
			return rows
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
				.where(
					and(
						eq(eventUserTable.status, 'active'),
						eq(mainEventUser.status, 'active'),
						or(
							// the related event has a parentId of the main event
							and(eq(eventTable.eventId, eventId), ne(eventUserTable.type, 'attendee')),
							and(
								inArray(mainEventUser.type, [
									'speaker',
									'host',
									'main-stage-speaker',
									'showcase-speaker',
								]),
							),
						),
					),
				)
			return orderBy(users, ['user.lastName', 'user.firstName'], ['asc', 'asc'])
		},
	}
	return fns
}
