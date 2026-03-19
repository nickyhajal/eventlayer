import { error } from '@sveltejs/kit'
import QRCode from 'qrcode'

import { EventFns } from '@matterloop/api'

export const load = async ({ locals, params, url }) => {
  if (!params.sponsorId) {
    throw error(404, 'No sponsor id')
  }

  const eventFns = EventFns({ eventId: locals.event.id })
  const sponsor = await eventFns.getSponsor(params.sponsorId)

  if (!sponsor) {
    throw error(404, 'Sponsor not found')
  }

  const publicUrl = `${url.protocol}//${url.host}/expo/${sponsor.id}`
  const qrcode = await QRCode.toDataURL(publicUrl, {
    width: 320,
  })

  return {
    sponsor,
    publicUrl,
    qrcode,
    leads: await eventFns.getSponsorLeads(params.sponsorId),
  }
}
