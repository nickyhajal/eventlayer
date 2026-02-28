import { EventFns } from '@matterloop/api'
import { orderBy, uniqBy } from '@matterloop/util'

export const load = async (req) => {
  const { locals, url } = req
  const eventFns = EventFns({ eventId: locals.event.id })
  const events = await eventFns.getEvents({ type: 'program' })
  const myEvents = await eventFns.getUserEvents(locals.me)
  const filtered = events.filter(({ eventFor }) => {
    return eventFor !== 'selected' && eventFor !== 'rsvp'
  })
  console.log(events)
  return {
    events: uniqBy(orderBy([...filtered, ...myEvents], ['startsAt']), 'id'),
  }
}
