import { fail, redirect } from '@sveltejs/kit'

import { lucia } from '@matterloop/api'
import { db, eq, eventTicketTable, userTable } from '@matterloop/db'

export const load = async ({ locals, params, cookies }) => {
	if (!params?.code) {
		return { error: 'no code' }
	}
	try {
		const tickets = await db.query.eventTicketTable.findMany({
			where: eq(eventTicketTable.assignKey, params.code),
		})
		if (!tickets.length) {
			return { error: 'no ticket' }
		}
		if (!tickets[0].userId) {
			return { error: 'no user' }
		}
		const session = await lucia.createSession(tickets[0].userId, {})
		const sessionCookie = lucia.createSessionCookie(session.id)
		cookies.set(sessionCookie.name, sessionCookie.value, {
			...sessionCookie.attributes,
			path: '/',
			sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
		})
		const user = await db.query.userTable.findFirst({
			where: eq(userTable.id, tickets[0].userId),
		})
		return { tickets, me: user }
	} catch (e) {
		// console.log(e)
		return {}
	}
}
