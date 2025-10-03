// routes/login/+page.server.ts
import { error, fail, redirect } from '@sveltejs/kit'
import { message, setError, superValidate } from 'sveltekit-superforms/server'
import { z } from 'zod'

import { EventFns, VenueFns } from '@matterloop/api'
import { db, eq, sponsorTable } from '@matterloop/db'

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const load = async ({ locals, params }) => {
  if (!params.sponsorId) {
    return error(404, 'No sponsor id')
  }
  const sponsor = await db.query.sponsorTable.findFirst({
    where: eq(sponsorTable.id, params.sponsorId),
    with: { photo: true, users: { with: { user: true } } },
  })
  if (!sponsor) {
    return error(404, 'Sponsor not found')
  }
  return { sponsor }
}
