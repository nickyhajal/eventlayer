import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { and, db, eq, eventUserTable, inArray } from '@matterloop/db'

export const load = async (req) => {
	const { locals, url, params } = req
	const eventFns = EventFns({ eventId: params.eventId, mainEventId: locals.event.id })
	const mainEventFns = EventFns({ eventId: locals.event.id })
	const meals = await mainEventFns.getMeals()
	let myLunch = null
	if (locals.me) {
		const ids = meals.map((event) => event.id)
		myLunch = await db.query.eventUserTable.findFirst({
			where: and(inArray(eventUserTable.eventId, ids), eq(eventUserTable.userId, locals.me.id)),
		})
	}
	const users = await eventFns.getUsers()
	return {
		event: await eventFns.get(),
		users: await eventFns.getUsers(),
		myLunch,
	}
}
