import { error } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
  const { locals, url, params } = req
  const eventFns = EventFns({ eventId: locals.event.id })
  const sponsor = await eventFns.getSponsor(params.sponsorId)

  if (!sponsor) {
    throw error(404, 'Sponsor not found')
  }

  return {
    sponsor,
    isHearted: Boolean(await eventFns.getSponsorHeart(params.sponsorId, locals.me?.id)),
    autoHeart: url.searchParams.get('heart') === '1',
    heartSource: url.searchParams.get('source') || 'manual',
  }
}
