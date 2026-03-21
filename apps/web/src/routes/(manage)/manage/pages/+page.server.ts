// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'

export const load = async ({ locals }) => {
  if (!locals.event.id) {
    error(404, 'Event not found')
  }
  const eventFns = EventFns({ eventId: locals.event.id })
  const [pages, users, checkinStats] = await Promise.all([
    eventFns.getPages(),
    eventFns.getUsersWithInfo(),
    eventFns.getCheckinStats(),
  ])

  return {
    pages,
    stats: {
      attendees: users.length,
      checkinsCompleted: checkinStats.checkedInIds.length,
    },
  }
}
