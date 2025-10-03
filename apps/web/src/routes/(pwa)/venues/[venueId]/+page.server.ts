import { redirect } from '@sveltejs/kit'

import { EventFns, VenueFns } from '@matterloop/api'

export const load = async (req) => {
  const { locals, url, params } = req
  const venueFns = VenueFns({ venueId: params.venueId })
  return {
    venue: await venueFns.get(),
  }
}
