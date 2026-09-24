import { error } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'

import { canSeePrivateSponsors } from '$lib/server/canSeePrivateSponsors'

export const load = async (req) => {
  const { locals, url, params } = req
  const eventFns = EventFns({ eventId: locals.event.id })
  const sponsor = await eventFns.getSponsor(params.sponsorId, {
    includePrivate: canSeePrivateSponsors(locals.me),
  })
  if (!sponsor) {
    throw error(404, 'Sponsor not found')
  }
  return {
    sponsor,
  }
}
