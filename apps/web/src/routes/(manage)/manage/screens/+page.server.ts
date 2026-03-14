import { error } from '@sveltejs/kit'

import { ScreenFns } from '@matterloop/api'

export const load = async ({ locals }) => {
  if (!locals.event.id) {
    error(404, 'Event not found')
  }
  const screenFns = ScreenFns({ eventId: locals.event.id })
  const global = await screenFns.getGlobal()
  const screens = await screenFns.getScreens()
  const screensWithConfig = await Promise.all(
    screens.map(async (screen) => ({
      ...screen,
      config: await screenFns.getConfigByScreenId(screen.id),
    })),
  )
  return {
    global,
    screens: screensWithConfig,
  }
}
