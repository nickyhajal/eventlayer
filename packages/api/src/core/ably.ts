import Ably from 'ably'
import { ABLY_API_KEY } from '$env/static/private'
let restClient: Ably.Rest | null = null

function getRestClient() {
  if (!ABLY_API_KEY) return null
  if (!restClient) {
    restClient = new Ably.Rest(ABLY_API_KEY)
  }
  return restClient
}

export function getScreensChannelName(eventId: string) {
  return `event:${eventId}:screens`
}

export async function publishScreensInvalidation(eventId: string, data?: Record<string, unknown>) {
  const rest = getRestClient()
  if (!rest) return false
  const channel = rest.channels.get(getScreensChannelName(eventId))
  await channel.publish('screens-updated', {
    updatedAt: new Date().toISOString(),
    ...data,
  })
  return true
}

export async function createScreensTokenRequest({
  eventId,
  clientId,
}: {
  eventId: string
  clientId?: string
}) {
  const rest = getRestClient()
  if (!rest) return null
  const channelName = getScreensChannelName(eventId)
  const capability = JSON.stringify({
    [channelName]: ['subscribe'],
  })
  return rest.auth.createTokenRequest({
    capability,
    clientId,
  })
}
