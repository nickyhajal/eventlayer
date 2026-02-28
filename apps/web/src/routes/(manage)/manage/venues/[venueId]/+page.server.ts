// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { EventFns, VenueFns } from '@matterloop/api'

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const load = async ({ locals, params }) => {
  if (!params.venueId) {
    return error(404, 'No venue id')
  }
  const venue = await VenueFns({ venueId: params.venueId, eventId: locals.event.id }).get()
  if (!venue) {
    return error(404, 'Venue not found')
  }
  return { venue }
}
