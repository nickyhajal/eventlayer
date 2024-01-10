// import { meRouter } from '$lib/server/procedures/me'
// import { mediaRouter } from '$lib/server/procedures/media'
import { formRouter } from '$lib/server/procedures/form'
import { formElemenRouter } from '$lib/server/procedures/formElement'
import { formSessionRouter } from '$lib/server/procedures/formSession'
import { metricRouter } from '$lib/server/procedures/metric'
import { noteRouter } from '$lib/server/procedures/note'
// import { notificationRouter } from '$lib/server/procedures/notifications'
import { trpcApp } from '$lib/server/procedures/procedureWithContext'

export const router = trpcApp.router({
	// me: meRouter,
	// media: mediaRouter,
	// notification: notificationRouter,
	note: noteRouter,
	metric: metricRouter,
	formSession: formSessionRouter,
	formElement: formElemenRouter,
	form: formRouter,
})

export type Router = typeof router
