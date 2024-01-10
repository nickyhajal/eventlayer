import Tracker from '@openreplay/tracker'
import type * as SentryBrowser from '@sentry/sveltekit'

type SentryBrowserType = typeof SentryBrowser

let tracker: Tracker

export function initOpenReplay(Sentry: SentryBrowserType) {
  tracker = new Tracker({
    projectKey: '1xTKitR2KFJZfPuk32h3',
    __DISABLE_SECURE_MODE: true,
    onStart: ({ sessionToken, sessionID }) => {
      console.log('OpenReplay tracker started with session: ', sessionID)
      Sentry.setTag('openReplaySessionToken', sessionToken)
      Sentry.setTag('openReplaySessionURL', tracker.getSessionURL())
    },
  })

  tracker.start()
}
export function setOpenReplayUser(user: string) {
  tracker.setUserID(user)
}
export function setOpenReplayMeta(key: string, value: string) {
  tracker.setMetadata(key, value)
}
