import { EventFns } from '@matterloop/api'

export const load = async (req) => {
  const eventFns = EventFns({ eventId: req.locals.event.id })
  const event = await eventFns.get()
  return {
    me: req.locals.me ? req.locals.me : null,
    event,
    venues: await eventFns.getVenues(),
  }
}
