// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'

import { EventFns } from '@matterloop/api'
import { and, asc, db, eq, mediaTable } from '@matterloop/db'

export const load = async ({ locals, params }) => {
	if (!locals.event.id) {
		error(404, 'Event not found')
	}
	return {
		media: await db.query.mediaTable.findFirst({
			where: and(eq(mediaTable.id, params.mediaId)),
		}),
	}
}
