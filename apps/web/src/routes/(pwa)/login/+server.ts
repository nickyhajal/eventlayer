// routes/login/+page.server.ts
import { error, fail, json, redirect } from '@sveltejs/kit'
import { z } from 'zod'

import { lucia } from '@matterloop/api'
import { db, eq, loginLinkTable } from '@matterloop/db'

const schema = z.object({
	code: z.string(),
})

export const GET = async ({ params }) => {
	return json({ status: 'success' })
}
export const POST = async ({ request, cookies, locals }) => {
	const formData = await request.json()
	console.log('>>>>>>> LOGIN')
	try {
		const { code } = schema.parse(formData)
		console.log('>>>>>>> CODE', code)
		const link = await db.query.loginLinkTable.findFirst({
			where: eq(loginLinkTable.publicId, code),
		})
		console.log(1)
		if (!link) {
			console.log(2)
			return error(401, 'Invalid code')
		}
		console.log(3)
		const session = await lucia.createSession(link.userId, {})
		console.log(4, session)
		const sessionCookie = lucia.createSessionCookie(session.id)
		console.log(5, sessionCookie)
		cookies.set(sessionCookie.name, sessionCookie.value, {
			...sessionCookie.attributes,
			path: '/',
			sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
		})
		return json({ status: 'success' })
	} catch (e) {
		console.log(e)
		return error(401, e)
	}
	return json({ status: 'error' })
}
