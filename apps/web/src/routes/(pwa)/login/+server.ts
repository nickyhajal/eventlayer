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
	try {
		const { code } = schema.parse(formData)
		const link = await db.query.loginLinkTable.findFirst({
			where: eq(loginLinkTable.publicId, code),
		})
		if (!link) {
			return error(401, 'Invalid code')
		}
		const session = await lucia.createSession(link.userId, {})
		const sessionCookie = lucia.createSessionCookie(session.id)
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
