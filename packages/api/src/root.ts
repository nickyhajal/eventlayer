import { trpcApp } from './procedureWithContext'
import { contentProcedures } from './router/contentProcedures'
import { eventProcedures } from './router/eventProcedures'
import { formElementProcedures } from './router/formElementProcedures'
import { formProcedures } from './router/formProcedures'
import { formSessionProcedures } from './router/formSessionProcedures'
import { meRouter } from './router/me'
import { mediaProcedures } from './router/mediaProcedures'
import { sponsorProcedures } from './router/sponsorProcedures'
import { userProcedures } from './router/userProcedures'
import { venueProcedures } from './router/venueProcedures'

export const router = trpcApp.router({
	me: meRouter,
	event: eventProcedures,
	venue: venueProcedures,
	form: formProcedures,
	formElement: formElementProcedures,
	formSession: formSessionProcedures,
	user: userProcedures,
	media: mediaProcedures,
	content: contentProcedures,
	sponsor: sponsorProcedures,
})

export type Router = typeof router
