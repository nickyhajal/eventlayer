// routes/login/+page.server.ts
// import { auth } from '@matterloop/api'
import { error, fail, json, redirect } from '@sveltejs/kit'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const POST = async ({ request, locals }) => {
  const formData = await request.json()
  try {
    const { email, password } = schema.parse(formData)
    const key = await auth.useKey('email', email, password)
    const session = await auth.createSession({ userId: key.userId, attributes: {} })
    locals.auth.setSession(session)
    return json({ status: 'success' })
  } catch (e) {
    console.log(e)
    return error(401, e)
  }
}
