// hooks.server.ts
import { auth } from '@matterloop/api'
import { createContext } from '@matterloop/api/src/procedureWithContext'
import { router } from '@matterloop/api/src/root'
import { db, eq, eventTable } from '@matterloop/db'
import { userTable } from '@matterloop/db/types'
import { error, fail, redirect, type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_BASE_URL } from '$env/static/public'
import type { RouteConfig } from '$lib/server/core/routeConfig'
import { getConfigForRoute } from '$lib/server/core/routeHelper'
import { createTRPCHandle } from 'trpc-sveltekit'

// import { getConfigForRoute } from '$lib/server/core/routeHelper';
// import type { RouteConfig } from '$lib/server/core/routeConfig';
// import type { HandleServerError } from '@sveltejs/kit'
// import * as Sentry from '@sentry/sveltekit';
// import mailer from '$lib/server/mailer';

// Sentry.init({
// 	environment: NODE_ENV,
// 	dsn: 'https://d8dd3f742623485f9780e4cd6cca66b2@o419323.ingest.sentry.io/4505153344962560',
// 	// Performance Monitoring
// 	tracesSampleRate: 1.0 // Capture 100% of the transactions. Adjust this value in production as necessary.
// });
// export const handleError = Sentry.handleErrorWithSentry();

const handleRouteRedirect = (defaultRedirect = '/', route: RouteConfig) => {
	const { failedAuthRedirect } = route
	throw redirect(303, failedAuthRedirect?.base || defaultRedirect)
}

export const handleCors: Handle = async ({ resolve, event }) => {
	// Apply CORS header for API routes
	const origin = event.request.headers.get('origin')
	if (
		event.url.pathname.startsWith('/trpc') ||
		event.url.pathname.startsWith('/signup') ||
		event.url.pathname.startsWith('/login')
	) {
		// Required for CORS to work
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Origin': origin,
					// 'Access-Control-Allow-Headers': origin,
					'Access-Control-Allow-Credentials': true,
				},
			})
		}
	}

	const response = await resolve(event)
	response.headers.append('Access-Control-Allow-Origin', origin)
	response.headers.append('Access-Control-Allow-Credentials', true)
	return response
}

const handleInit: Handle = async ({ event, resolve }) => {
	// NotificationSendController.BASE_URL = PUBLIC_BASE_URL;
	// NotificationSendController.PROTOCOL = PUBLIC_PROTOCOL;
	// setMailer(mailer);
	// if (event.url.hostname.startsWith('www.')) {
	// 	throw redirect(303, `${event.url.protocol}//${PUBLIC_BASE_URL}/${event.url.pathname}}`);
	// }
	// initRedis(REDIS_URL);
	// initPush();
	return resolve(event)
}
export const handleUserContext: Handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event)
	const sess = await event.locals.auth.validate()
	if (sess?.user?.userId) {
		const fullUser = await db
			.select()
			.from(userTable)
			.where(eq(userTable.id, sess.user?.userId))
		event.locals.me = fullUser[0]
		event.locals.meId = fullUser[0].id
	}
	return await resolve(event)
}
const handleEventContext: Handle = async ({ event, resolve }) => {
	const hostname =
		event.request.headers.get('host')?.replace('http://', '').replace('https://', '') || ''
	event.locals.hostname = hostname
	if (hostname.includes(PUBLIC_BASE_URL || '')) {
		const bits = hostname.split('.')
		if (bits.length >= 3) {
			const mainEvent = await db.query.eventTable.findFirst({
				where: eq(eventTable.domainId, bits[0]),
			})
			if (event) event.locals.event = mainEvent
		}
	} else {
		const mainEvent = await db.query.eventTable.findFirst({
			where: eq(eventTable.domainId, hostname),
		})
		if (event) event.locals.event = mainEvent
	}
	return resolve(event)
}
const handleLogout: Handle = async ({ event, resolve }) => {
	if (event.url.pathname === '/logout') {
		const { session } = await event.locals.auth.validate()
		if (!session) throw fail(401)
		await auth.invalidateSession(session.sessionId) // invalidate session
		event.locals.auth.setSession(null) // remove cookie
		throw redirect(303, '/')
	}
	return resolve(event)
}
const handleRouteConfig: Handle = async ({ event, resolve }) => {
	const { me } = event.locals
	const routeConfig = getConfigForRoute(event.url.pathname)
	const { auth } = routeConfig
	if (auth === 'logged-out' && me) {
		handleRouteRedirect('/', routeConfig)
	} else if (auth === 'logged-in' && !me) {
		handleRouteRedirect('/login', routeConfig)
	} else if (auth === 'super-admin' && !me?.isSuperAdmin) {
		throw error(404, {
			message: 'Page not found',
		})
	}
	try {
		const rsp = await resolve(event)
		return rsp
	} catch (e) {
		console.log('route config', e)
	}
	return resolve(event)
}
const handleTrpc = createTRPCHandle({
	router,
	createContext,
	onError: ({ type, path, error }) =>
		console.error(`Encountered error while trying to process ${type} @ ${path}:`, error),
})

export const handle: Handle = sequence(
	// Sentry.sentryHandle(),
	handleCors,
	handleInit,
	handleUserContext,
	handleEventContext,
	handleLogout,
	handleRouteConfig,
	handleTrpc,
)
