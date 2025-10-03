// routes/signup/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { lucia } from '@matterloop/api'
import { db } from '@matterloop/db'
import { userTable } from '@matterloop/db/types.js'

const schema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const POST = async ({ request, locals }) => {
  const formData = await request.json()
  try {
    const { email, password, firstName, lastName } = schema.parse(formData)
    const existing = await db.query.userTable.findFirst({ where: eq(userTable.email, email) })
    if (existing) {
      error(401, 'An account already exists with this email')
    }
    // const user = await lucia.createUser({
    // 	userId: crypto.randomUUID(),
    // 	key: {
    // 		providerId: 'email',
    // 		providerUserId: email,
    // 		password,
    // 	},
    // 	attributes: {
    // 		email,
    // 		first_name: firstName,
    // 		last_name: lastName,
    // 	},
    // })
    // const session = await auth.createSession({ userId: user.userId, attributes: {} })
    locals.auth.setSession(session)
    return new Response(user)
  } catch (e) {
    console.log(e)
    error(401, { ...e })
  }
}
