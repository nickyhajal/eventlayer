import { User } from 'lucia'

import {
	alias,
	and,
	asc,
	contentTable,
	db,
	eq,
	eventTable,
	EventUser,
	eventUserCheckinTable,
	eventUserInfoTable,
	eventUserTable,
	exists,
	formTable,
	gt,
	gte,
	inArray,
	isNotNull,
	key,
	mediaTable,
	menuTable,
	ne,
	or,
	pageTable,
	sponsorTable,
	sql,
	userTable,
	venueTable,
	type Event,
} from '@matterloop/db'
import { dayjs, groupBy, keyBy, omit, orderBy } from '@matterloop/util'

import { redis } from '../core/redis'

interface Args {
	eventId: string
	mainEventId?: string
	load?: boolean
}

interface GetEventsArgs {
	eventFor?: string
}

export const EventFns = (args: string | Args) => {
	const eventId = typeof args === 'string' ? args : args.eventId
	const mainEventId = (typeof args === 'string' ? args : args.mainEventId) || undefined
	const fns = {
		get: async () => {
			const key = `event_heavy:${eventId}`
			let event = await redis.get<Event>(key)
			if (!event) {
				// IF DEPENDENCIES CHANGE WE MUST UPDATE CACHE EXPIRIES
				event = await db.query.eventTable.findFirst({
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
						content: {
							where: and(eq(contentTable.eventId, eventId), ne(contentTable.type, 'faq')),
						},
					},
				})
				console.log(`set ${key}`)
				redis.set(key, event)
			} else {
				console.log(`use ${key}`)
			}
			if (event?.content) {
				return {
					...event,
					contentByKey: keyBy(event.content, 'key'),
				}
			}
			return event
		},
		getMeals: async () => {
			const key = `event_meals:${eventId}`
			let events = await redis.get<Event[]>(key)
			if (!events) {
				events = await db.query.eventTable.findMany({
					where: and(eq(eventTable.eventId, eventId), eq(eventTable.type, 'meal')),
					with: {
						photo: true,
						venue: { with: { photo: true } },
						users: { with: { user: { with: { photo: true } } } },
					},
					orderBy: [asc(eventTable.startsAt), asc(eventTable.ord)],
				})
				redis.set(key, events)
			}
			return events
		},
		getNextEvents: async (timezoneShift = 7) => {
			return db.query.eventTable.findMany({
				where: and(
					eq(eventTable.eventId, eventId),
					gte(eventTable.startsAt, dayjs().subtract(timezoneShift, 'h').toISOString()),
				),
				orderBy: asc(eventTable.startsAt),
				with: { photo: true, venue: true },
				limit: 3,
			})
		},
		getUsers: async () => {
			const key = `event_users:${eventId}`
			const users = await redis.get<User[]>(key)
			// const users =  await redis.get(key)
			if (users) {
				console.log('use user cache')
				return users
			} else {
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
					const finalUsers = userRows.map((user) => {
						return {
							photo: user.media,
							...user.auth_user,
							...user.event_user,
							...user.mainEventUser,
						}
					})
					redis.set(key, finalUsers)
					return finalUsers
				}
				return [] as EventUser[]
			}
		},
		getUsersWithInfo: async () => {
			const key = `event_usersWithInfo:${eventId}`
			const users = false // await redis.get(key)
			if (users) {
				return users
			} else {
				const users = await fns.getUsers()
				const ids = users.map((user) => user.userId)
				const info = await db.query.eventUserInfoTable.findMany({
					where: and(
						inArray(eventUserInfoTable.userId, ids),
						eq(eventUserInfoTable.eventId, eventId),
					),
				})
				const infoByUserId = groupBy(info, 'userId')
				const finalUsers = users.map((user) => {
					return {
						...user,
						info: keyBy(infoByUserId[user.userId], 'key'),
					}
				})
				// redis.set(key, finalUsers)
				return finalUsers
			}
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
		getEvents: async ({ eventFor }: GetEventsArgs = {}) => {
			const events = await db.query.eventTable.findMany({
				where: and(
					eq(eventTable.eventId, eventId),
					eventFor ? eq(eventTable.eventFor, eventFor) : undefined,
				),
				with: {
					photo: true,
					venue: { with: { photo: true } },
					users: { with: { user: { with: { photo: true } } } },
				},
				orderBy: [asc(eventTable.startsAt), asc(eventTable.ord)],
			})
			return events
		},
		getUserEvents: async (user: User) => {
			const allowedTypes = ['']
			const rsvps = await db.query.eventUserTable.findMany({
				where: and(eq(eventUserTable.mainId, eventId), eq(eventUserTable.userId, user.id)),
			})
			const rsvpIds = rsvps.flatMap((rsvp) => rsvp.eventId || [])
			const mine = await db.query.eventTable.findMany({
				where: and(
					eq(eventTable.eventId, eventId),
					or(
						inArray(eventTable.eventFor, allowedTypes),
						rsvps.length ? inArray(eventTable.id, rsvpIds) : undefined,
					),
				),
				with: {
					photo: true,
					venue: { with: { photo: true } },
					users: { with: { user: { with: { photo: true } } } },
				},
				orderBy: [asc(eventTable.startsAt), asc(eventTable.ord)],
			})
			return mine
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
		toggleUserCheckin: async ({ staffId, userId }: { staffId: string; userId: string }) => {
			const existing = await db.query.eventUserCheckinTable.findFirst({
				where: and(
					eq(eventUserCheckinTable.eventId, eventId),
					eq(eventUserCheckinTable.userId, userId),
				),
			})
			redis.del(`checkin_stats:${eventId}`)
			if (existing) {
				await db
					.delete(eventUserCheckinTable)
					.where(
						and(
							eq(eventUserCheckinTable.eventId, eventId),
							eq(eventUserCheckinTable.userId, userId),
						),
					)
				existing.status = 'removed'
				return existing
			} else {
				const row = db
					.insert(eventUserCheckinTable)
					.values({
						status: 'checked-in',
						userId,
						eventId,
						...(staffId ? { staffId } : {}),
						...(mainEventId ? { mainEventId } : {}),
					})
					.returning()
				return row
			}
		},
		getCheckinStats: async () => {
			const key = `checkin_stats:${eventId}`
			let stats = await redis.get(key)
			if (stats) {
				return stats
			}
			const checkins = await db.query.eventUserCheckinTable.findMany({
				where: and(
					eq(eventUserCheckinTable.eventId, eventId),
					eq(eventUserCheckinTable.status, 'checked-in'),
				),
			})
			stats = {
				checkedInIds: checkins.map(({ userId }) => userId),
			}
			redis.set(key, stats)
			return stats
		},
		toggleRsvp: async ({
			eventId,
			userId,
			type,
		}: {
			eventId: string
			userId: string
			type: string
		}) => {
			const event = await db.query.eventTable.findFirst({
				where: and(eq(eventTable.id, eventId)),
			})
			let row: Partial<EventUser> | undefined
			let action = ''
			if (!event) {
				throw new Error('Event not found')
			}
			const eventUser = await db.query.eventUserTable.findFirst({
				where: and(eq(eventUserTable.eventId, eventId), eq(eventUserTable.userId, userId)),
			})
			if (eventUser) {
				row = { ...eventUser }
				action = 'remove'
				await db.delete(eventUserTable).where(eq(eventUserTable.id, eventUser.id))
			} else {
				const res = await db.insert(eventUserTable).values({ eventId, userId }).returning()
				if (res) {
					row = res[0]
					action = 'add'
				}
			}
			return {
				row,
				action,
			}
		},
	}
	return fns
}
