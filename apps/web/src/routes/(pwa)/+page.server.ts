import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { and, db, eq, eventUserInfoTable } from '@matterloop/db'

export const load = async (req) => {
	const { locals, url } = req
	if (locals?.event?.id) {
		const eventFns = EventFns({ eventId: locals.event.id })
		return {
			upcoming: await eventFns.getNextEvents(),
			info: await db.query.eventUserInfoTable.findMany({
				where: and(
					eq(eventUserInfoTable.eventId, locals.event.id),
					eq(eventUserInfoTable.userId, locals.me.id),
				),
			}),
		}
	}
	return {}
}
