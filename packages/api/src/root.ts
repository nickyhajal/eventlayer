import { trpcApp } from './procedureWithContext'
import { checkinProcedures } from './router/checkinProcedures'
import { contentProcedures } from './router/contentProcedures'
import { eventProcedures } from './router/eventProcedures'
import { formElementProcedures } from './router/formElementProcedures'
import { formProcedures } from './router/formProcedures'
import { formSessionProcedures } from './router/formSessionProcedures'
import { meRouter } from './router/me'
import { mediaProcedures } from './router/mediaProcedures'
import { menuProcedures } from './router/menuProcedures'
import { pageProcedures } from './router/pageProcedures'
import { sponsorProcedures } from './router/sponsorProcedures'
import { userProcedures } from './router/userProcedures'
import { venueProcedures } from './router/venueProcedures'

export const router = trpcApp.router({
	me: meRouter,
	event: eventProcedures,
	venue: venueProcedures,
	form: formProcedures,
	checkin: checkinProcedures,
	formElement: formElementProcedures,
	formSession: formSessionProcedures,
	user: userProcedures,
	media: mediaProcedures,
	content: contentProcedures,
	page: pageProcedures,
	sponsor: sponsorProcedures,
	menu: menuProcedures,
})

export type Router = typeof router
