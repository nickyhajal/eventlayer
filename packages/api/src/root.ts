import { trpcApp } from './procedureWithContext'
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
})

export type Router = typeof router
