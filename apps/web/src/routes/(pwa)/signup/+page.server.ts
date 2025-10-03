// routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const load = async ({ locals }) => {
  const form = await superValidate(schema)
  return { form }
}
