import { trpcApp } from './procedureWithContext'
import { meRouter } from './router/me'

export const router = trpcApp.router({
	me: meRouter,
})

export type Router = typeof router
