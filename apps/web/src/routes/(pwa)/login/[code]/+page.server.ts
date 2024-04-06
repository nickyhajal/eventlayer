import { fail, redirect } from '@sveltejs/kit'

import { lucia } from '@matterloop/api'
import { db, eq, loginLinkTable } from '@matterloop/db'

export const load = async ({ locals, params, cookies }) => {
	// if (!params.code) {
	// 	console.log('return')
	// 	return {}
	// }
	try {
		const link = await db.query.loginLinkTable.findFirst({
			where: eq(loginLinkTable.publicId, params.code),
		})
		if (!link) {
			return {}
		}
		const session = await lucia.createSession(link.userId, {})
		const sessionCookie = lucia.createSessionCookie(session.id)
		cookies.set(sessionCookie.name, sessionCookie.value, {
			...sessionCookie.attributes,
			path: '/',
			sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
		})
	} catch (e) {
		console.log(e)
		return {}
	}
	redirect(302, '/')
}