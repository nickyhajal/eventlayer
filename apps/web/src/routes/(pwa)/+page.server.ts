import { redirect } from '@sveltejs/kit'

import { EventFns } from '@matterloop/api'
import { redis } from '@matterloop/api/src/core/redis'
import { and, db, eq, eventUserInfoTable } from '@matterloop/db'
import { dayjs, orderBy, uniqBy } from '@matterloop/util'

export const load = async (req) => {
  const { locals, url } = req
  if (locals?.event?.id) {
    const eventFns = EventFns({ eventId: locals.event.id })
    const [programEvents, myEvents, nextAttendingRaw] = await Promise.all([
      eventFns.getEvents({ type: 'program' }),
      eventFns.getUserEvents(locals.me),
      redis.get<string>(`next_attending:${locals.event.id}`),
    ])
    const comparisonNow = dayjs().subtract(7, 'h')
    const upcoming = uniqBy(
      orderBy([
        ...programEvents.filter(({ eventFor }) => eventFor !== 'selected' && eventFor !== 'rsvp'),
        ...myEvents,
      ], ['startsAt']),
      'id',
    ).filter(({ startsAt }) => startsAt && !dayjs(startsAt).isBefore(comparisonNow)).slice(0, 3)
    let nextAttending: Array<{ firstName: string; lastName: string; photo: string }> = []
    if (typeof nextAttendingRaw === 'string') {
      try {
        nextAttending = JSON.parse(nextAttendingRaw) ?? []
      } catch {
        nextAttending = []
      }
    } else if (nextAttendingRaw) {
      nextAttending = nextAttendingRaw
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
