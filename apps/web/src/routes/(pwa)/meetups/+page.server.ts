import { EventFns } from '@matterloop/api'

export const load = async (req) => {
  const { locals } = req
  const eventFns = EventFns({ eventId: locals.event.id })
  // Only meetup-type events; the viewer's own schedule lives on /schedule
  return {
    events: await eventFns.getEvents({ type: 'meetup' }),
  }
}
