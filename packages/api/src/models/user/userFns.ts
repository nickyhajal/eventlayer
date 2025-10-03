import { and, asc, db, eq, eventTable, eventUserTable, userTable, venueTable } from '@matterloop/db'

interface Args {
  eventId: string
  userId: string
}

export const UserFns = ({ userId, eventId }: Args) => ({
  get: async () => {
    const event = await db.query.userTable.findFirst({
      where: and(eq(userTable.id, userId)),
    })
    return event
  },
  getEvents: async () => {
    const events = await db.query.eventTable.findMany({
      where: and(eq(eventTable.venueId, venueId), eq(eventTable.eventId, eventId)),
    })
    return events
  },
})
