// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'

import { createContext, EventFns } from '@matterloop/api'
import { eventProcedures } from '@matterloop/api/src/router/eventProcedures'

export const load = async ({ locals }) => {
  if (!locals.event.id) {
    error(404, 'Event not found')
  }
  const eventFns = EventFns({ eventId: locals.event.id })

  // Load API keys
  const ctx = await createContext({ event: locals.event, me: locals.me })
  const apiKeys = await eventProcedures
    .createCaller(ctx)
    .listApiKeys({ eventId: locals.event.id })

  return {
    content: await eventFns.getContent(),
    apiKeys
  }
}
