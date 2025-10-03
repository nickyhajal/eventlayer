// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'

import { EventFns } from '@matterloop/api'

export const load = async ({ locals }) => {
  if (!locals.event.id) {
    error(404, 'Event not found')
  }
  const eventFns = EventFns({ eventId: locals.event.id })
  return { content: await eventFns.getContent() }
}
