import { EventFns } from '@matterloop/api'
import { orderBy, uniqBy } from '@matterloop/util'

export const load = async (req) => {
  const { locals } = req
  const eventFns = EventFns({ eventId: locals.event.id })
  const events = await eventFns.getEvents({ type: 'session' })
  return {
    events: uniqBy(orderBy([...events], ['startsAt']), 'id'),
  }
}
