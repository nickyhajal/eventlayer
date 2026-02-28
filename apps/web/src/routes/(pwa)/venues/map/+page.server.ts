// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'

import { EventFns } from '@matterloop/api'
import { and, asc, db, eq, mediaTable } from '@matterloop/db'

export const load = async ({ locals }) => {
  if (!locals.event.id) {
    error(404, 'Event not found')
  }
  const eventFns = EventFns(locals.event.id)
  return {
    venues: await eventFns.getVenues(),
    media: await db.query.mediaTable.findMany({
      where: and(eq(mediaTable.eventId, locals.event.id), eq(mediaTable.parentType, 'venueMap')),
      orderBy: asc(mediaTable.ord),
    }),
  }
}
