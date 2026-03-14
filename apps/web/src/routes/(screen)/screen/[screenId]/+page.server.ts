import { error } from '@sveltejs/kit'

import { EventFns, ScreenFns } from '@matterloop/api'
import { getScreensChannelName } from '@matterloop/api/src/core/ably'

export const load = async ({ locals, params }) => {
  if (!locals.event?.id) {
    error(404, 'Event not found')
  }

  const screenFns = ScreenFns({ eventId: locals.event.id })
  const resolved = await screenFns.getEffectiveConfigByKey(params.screenId)

  if (!resolved) {
    error(404, 'Screen not found')
  }

  const upcoming =
    resolved.effective.mode === 'upcoming_events'
      ? await EventFns({ eventId: locals.event.id }).getNextEvents()
      : []

  return {
    event: locals.event,
    screen: resolved.screen,
    effective: resolved.effective,
    upcoming,
    screensChannel: getScreensChannelName(locals.event.id),
  }
}
