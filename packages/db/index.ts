import { DB_URL } from '$env/static/private'
import { drizzle } from 'drizzle-orm/node-postgres'
import postgres from 'pg'

import * as contentSchema from './schema/content'
import * as eventSchema from './schema/event'
import * as organizationSchema from './schema/event'
import * as eventTicketSchema from './schema/event_ticket'
import * as eventUserSchema from './schema/event_user'
import * as eventUserCheckinSchema from './schema/event_user_checkin'
import * as eventUserConnectionSchema from './schema/event_user_connection'
import * as eventUserInfoSchema from './schema/event_user_info'
import * as eventMetaSchema from './schema/event_meta'
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
export * from './schema/event_meta'
export * from './schema/user'
export * from './schema/venue'
export * from './schema/media'
export * from './schema/sponsor'
export * from './schema/login_link'
export * from './schema/form'
export * from './schema/event_user_checkin'
export * from './schema/event_ticket'
export * from './schema/event_user_connection'
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
    ...eventMetaSchema,
    ...eventUserCheckinSchema,
    ...eventUserConnectionSchema,
    ...organizationSchema,
    ...eventUserSchema,
    ...eventTicketSchema,
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
export * from 'drizzle-orm/sql'
