import { DB_URL } from '$env/static/private'
import { drizzle } from 'drizzle-orm/node-postgres'
import postgres from 'pg'

import * as contentSchema from './schema/content'
import * as eventSchema from './schema/event'
import * as organizationSchema from './schema/event'
import * as eventUserSchema from './schema/event_user'
import * as eventUserInfoSchema from './schema/event_user_info'
import * as formSchema from './schema/form'
import * as loginLinkSchema from './schema/login_link'
import * as mediaSchema from './schema/media'
import * as menuSchema from './schema/menu'
import * as pageSchema from './schema/page'
import * as sponsorSchema from './schema/sponsor'
import * as userSchema from './schema/user'
import * as venueSchema from './schema/venue'

export * from './schema/event'
export * from './schema/content'
export * from './schema/organization'
export * from './schema/page'
export * from './schema/menu'
export * from './schema/event_user'
export * from './schema/event_user_info'
export * from './schema/user'
export * from './schema/venue'
export * from './schema/media'
export * from './schema/sponsor'
export * from './schema/login_link'
export * from './schema/form'
export * from './types'

export const connection = new postgres.Pool({
	connectionString: DB_URL,
})
export const db = drizzle(connection, {
	logger: false,
	schema: {
		...userSchema,
		...eventSchema,
		...eventUserInfoSchema,
		...organizationSchema,
		...eventUserSchema,
		...mediaSchema,
		...venueSchema,
		...contentSchema,
		...pageSchema,
		...menuSchema,
		...sponsorSchema,
		...loginLinkSchema,
		...formSchema,
	},
})

export { alias } from 'drizzle-orm/pg-core'
export * from 'drizzle-orm'
