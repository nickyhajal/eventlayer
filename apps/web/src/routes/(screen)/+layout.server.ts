import { EventFns } from '@matterloop/api'

export const load = async (req) => {
  if (req?.locals?.event?.id) {
    const eventFns = EventFns({ eventId: req.locals.event.id })
    const event = (await eventFns.get()) as any
    return {
      event: {
        ...event,
      },
    }
  }
  return {}
}
