import { inArray } from 'drizzle-orm'

import { EventFns } from '@matterloop/api'
import {
  alias,
  and,
  asc,
  contentTable,
  db,
  eq,
  eventTable,
  eventUserCheckinTable,
  eventUserInfoTable,
  eventUserTable,
  exists,
  formTable,
  gt,
  gte,
  mediaTable,
  menuTable,
  ne,
  or,
  pageTable,
  sponsorTable,
  sql,
  userTable,
  venueTable,
} from '@matterloop/db'

export const load = async (req) => {
  const { locals, url } = req
  const eventFns = EventFns({ eventId: req.locals.event.id })
  const events = await eventFns.getMeals()
  let myLunch = null
  if (locals.me) {
    const ids = events.map((event) => event.id)
    myLunch = await db.query.eventUserTable.findFirst({
      where: and(inArray(eventUserTable.eventId, ids), eq(eventUserTable.userId, locals.me.id)),
    })
  }
  return {
    events,
    myLunch,
  }
}
