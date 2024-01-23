import { trpcApp } from './procedureWithContext'
import { contentProcedures } from './router/contentProcedures'
import { eventProcedures } from './router/eventProcedures'
import { meRouter } from './router/me'
import { mediaProcedures } from './router/mediaProcedures'
import { userProcedures } from './router/userProcedures'
import { venueProcedures } from './router/venueProcedures'

export const router = trpcApp.router({
	me: meRouter,
	event: eventProcedures,
	venue: venueProcedures,
	user: userProcedures,
	media: mediaProcedures,
	content: contentProcedures,
})

export type Router = typeof router
