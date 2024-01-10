// import { mixpanel } from '$lib/mixpanel'
// import { initOpenReplay } from '$lib/openreplay'
// import * as Sentry from '@sentry/sveltekit'

// const href = location.href
// Sentry.init({
//   dsn: 'https://d8dd3f742623485f9780e4cd6cca66b2@o419323.ingest.sentry.io/4505153344962560',

//   // We recommend adjusting this value in production, or using tracesSampler
//   // for finer control
//   tracesSampleRate: 1.0,

//   // Optional: Initialize Session Replay:
//   integrations: [new Sentry.Replay()],
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
//   environment: href.includes('arena.co')
//     ? href.includes('staging')
//       ? 'staging'
//       : 'production'
//     : 'development',
// })
// initOpenReplay(Sentry)
// mixpanel.init('d31466ea2ccdbab8039a039b99a26817', {
//   debug: true,
//   ignore_dnt: true,
// })
// mixpanel.track_pageview()

// export const handleError = Sentry.handleErrorWithSentry()
