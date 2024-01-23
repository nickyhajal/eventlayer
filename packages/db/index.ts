import { DB_URL } from '$env/static/private'
import { drizzle } from 'drizzle-orm/node-postgres'
import postgres from 'pg'

import * as contentSchema from './schema/content'
import * as eventSchema from './schema/event'
import * as organizationSchema from './schema/event'
import * as eventUserSchema from './schema/event_user'
import * as mediaSchema from './schema/media'
import * as userSchema from './schema/user'
import * as venueSchema from './schema/venue'

export * from './schema/event'
export * from './schema/content'
export * from './schema/organization'
export * from './schema/event_user'
export * from './schema/user'
export * from './schema/venue'
export * from './schema/media'

export const connection = new postgres.Pool({
	connectionString: DB_URL,
})
export const db = drizzle(connection, {
	logger: false,
	schema: {
		...userSchema,
		...eventSchema,
		...organizationSchema,
		...eventUserSchema,
		...mediaSchema,
		...venueSchema,
		...contentSchema,
	},
})

export * from 'drizzle-orm'
