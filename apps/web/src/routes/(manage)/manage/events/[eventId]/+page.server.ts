// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { createContext, EventFns } from '@matterloop/api'
import { eventProcedures } from '@matterloop/api/src/router/eventProcedures'

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const load = async ({ locals, params }) => {
  if (!params.eventId) {
    return error(404, 'No event id')
  }
  const eventFns = await EventFns(params.eventId)
  const event = await eventFns.get()
  if (!event) {
    return error(404, 'Event not found')
  }

  // Load event_meta
  const ctx = await createContext({ event: locals.event, me: locals.me })
  const eventMeta = await eventProcedures
    .createCaller(ctx)
    .listEventMeta({ eventId: params.eventId })

  return { event, users: await eventFns.getUsers(), eventMeta }
}
