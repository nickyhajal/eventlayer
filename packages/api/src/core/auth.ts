import crypto from 'crypto'
import { authSessionTable, connection, db, userTable } from '@matterloop/db'
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { Lucia } from 'lucia'
import { createClient } from 'redis'

export const sessionClient = createClient({})
export const userSessionClient = createClient()

const adapter = new DrizzlePostgreSQLAdapter(db, authSessionTable, userTable)

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === 'production',
		},
	},
})

interface DatabaseUserAttributes {
	email: string
}
declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia
	}
}
