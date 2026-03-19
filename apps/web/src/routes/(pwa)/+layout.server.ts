import { redirect } from '@sveltejs/kit'
import * as icons from 'lucide-static'

import { EventFns } from '@matterloop/api'

export const load = async (req) => {
  if (req?.locals?.event?.id) {
    const eventFns = EventFns({ eventId: req.locals.event.id })
    const event = (await eventFns.get()) as any
    if (!event) {
      return {
        me: req.locals.me ? req.locals.me : null,
        event: null,
      }
    }
    const settings = (event?.settings ?? {}) as Record<string, unknown>
    const grooveApiKey =
      typeof settings.groove_api_key === 'string' ? settings.groove_api_key.trim() : ''
    const hasGrooveSupport = grooveApiKey.length > 0
    const { groove_api_key: _secretGrooveApiKey, ...safeSettings } = settings
    const me = req?.locals?.me
    if (
      event?.id &&
      me &&
      me.onboardStatus !== 'done' &&
      me.onboardFormId &&
      !req.url.pathname.includes('/welcome')
    ) {
      const form = await eventFns.getOnboardForm()
      if (form) {
        console.log('redirecting to welcome', req.url.pathname)
        redirect(302, '/welcome')
      }
    }
    event.menus = event.menus.map((r: any) => ({ ...r, icon: icons[r.icon as keyof typeof icons] }))
    return {
      me: req.locals.me ? req.locals.me : null,
      event: {
        ...event,
        settings: safeSettings,
        features: {
          ...(event?.features ?? {}),
          canGetHelp: hasGrooveSupport,
        },
      },
    }
  }
  return {}
}
