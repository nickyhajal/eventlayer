// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { EventFns } from '@matterloop/api'

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
  return { event, users: await eventFns.getUsers() }
}
