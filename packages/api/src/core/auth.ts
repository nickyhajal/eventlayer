import crypto from 'crypto'
import { pg } from '@lucia-auth/adapter-postgresql'
import { redis } from '@lucia-auth/adapter-session-redis'
import { NODE_ENV } from '$env/static/private'
import { lucia } from 'lucia'
import { sveltekit } from 'lucia/middleware'
import { createClient } from 'redis'

import { connection } from '@matterloop/db'

export const sessionClient = createClient({})
export const userSessionClient = createClient()

export const auth = lucia({
	adapter: pg(connection, {
		user: 'auth_user',
		key: 'auth_key',
		session: 'auth_session',
	}),

	env: NODE_ENV ? 'DEV' : 'PROD',
	csrfProtection: false,
	// session: redis(sessionClient),
	middleware: sveltekit(),
	generateCustomUserId: () => {
		return crypto.randomUUID()
	},
	getUserAttributes: (userData) => {
		return {
			userId: userData.id,
			email: userData.email,
			first_name: userData.first_name,
			last_name: userData.last_name,
		}
	},
})
export type Auth = typeof auth
