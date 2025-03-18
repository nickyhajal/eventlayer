import { redirect } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'
import { and, db, eq, mediaTable } from '@matterloop/db'

export const load = async (req) => {
	const { locals, url, params } = req
	const event = locals.event
	const map = await db.query.mediaTable.findFirst({
		where: and(eq(mediaTable.eventId, event.id), eq(mediaTable.parentType, 'venueMap')),
	})
	console.log('map', map)
	return { map }
}
