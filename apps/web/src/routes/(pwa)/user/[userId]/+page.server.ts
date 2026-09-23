import { error } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
  const { locals, url, params } = req
  const eventFns = EventFns({ eventId: locals.event.id })
  const user = await eventFns.getUser(params.userId)
  if (!user) error(404, 'User not found')
  return {
    user,
    events: await eventFns.getUserEvents(params.userId),
  }
}
