// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'

import { and, db, eq, eventTicketTable, isNull } from '@matterloop/db'

export const load = async ({ locals }) => {
  if (!locals.event.id) {
    error(404, 'Event not found')
  }
  const tickets = await db.query.eventTicketTable.findMany({
    where: and(eq(eventTicketTable.eventId, locals.event.id), isNull(eventTicketTable.assignedTo)),
    with: {
      user: true,
    },
  })
  return { tickets }
}
