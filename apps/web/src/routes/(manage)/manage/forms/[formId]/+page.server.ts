// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { EventFns, FormFns } from '@matterloop/api'

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const load = async ({ locals, params }) => {
  if (!params.formId) {
    return error(404, 'No form id')
  }
  const form = await FormFns({ formId: params.formId, eventId: locals.event.id }).get()
  if (!form) {
    return error(404, 'Form not found')
  }
  return { form }
}
