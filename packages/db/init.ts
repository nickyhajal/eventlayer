import { DB_URL } from '$env/static/private'
import { drizzle } from 'drizzle-orm/node-postgres'
import postgres from 'pg'

import * as eventSchema from './schema/event'
import * as organizationSchema from './schema/event'
import * as eventUserSchema from './schema/event_user'
import * as userSchema from './schema/user'
import * as venueSchema from './schema/venue'

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
		...venueSchema,
	},
})
