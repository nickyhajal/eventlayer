import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { redis } from '@matterloop/api/src/core/redis'
import { and, db, eq, eventUserInfoTable } from '@matterloop/db'

export const load = async (req) => {
  const { locals, url } = req
  if (locals?.event?.id) {
    const eventFns = EventFns({ eventId: locals.event.id })
    const [upcoming, nextAttendingRaw] = await Promise.all([
      eventFns.getNextEvents(),
      redis.get<string>(`next_attending:${locals.event.id}`),
    ])
    let nextAttending: Array<{ firstName: string; lastName: string; photo: string }> = []
    if (typeof nextAttendingRaw === 'string') {
      try {
        nextAttending = JSON.parse(nextAttendingRaw) ?? []
      } catch {
        nextAttending = []
      }
    }
    return {
      upcoming,
      nextAttending,
      info:
        locals.me?.id && locals.event?.id
          ? await db.query.eventUserInfoTable.findMany({
            where: and(
              eq(eventUserInfoTable.eventId, locals.event.id),
              eq(eventUserInfoTable.userId, locals.me.id),
            ),
          })
          : [],
    }
  }
  return {}
}
