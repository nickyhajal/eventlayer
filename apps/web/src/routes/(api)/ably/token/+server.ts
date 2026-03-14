import { env } from '$env/dynamic/private'
import { error, json } from '@sveltejs/kit'

import { createScreensTokenRequest } from '@matterloop/api/src/core/ably'

export const GET = async ({ locals }) => {
  if (!locals.event?.id) {
    throw error(404, 'Event not found')
  }
  if (!env.ABLY_API_KEY) {
    throw error(500, 'ABLY_API_KEY is missing on the server')
  }
  const tokenRequest = await createScreensTokenRequest({
    eventId: locals.event.id,
    clientId: `screen-${locals.event.id}`,
  })
  if (!tokenRequest) {
    throw error(500, 'Ably is not configured')
  }
  return json(tokenRequest)
}
