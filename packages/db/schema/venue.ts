import { relations, sql, type InferModel } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'

export const venueTable = pgTable('venue', {
	id: uuid('id')
		.default(sql`uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	name: text('name'),
	maxAttendees: integer('max_attendees'),
	address: text('address'),
	street: text('street'),
	city: text('city'),
	region: text('region'),
	country: text('country'),
	postalCode: text('postal_code'),
	lat: text('lat'),
	lon: text('lon'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

// export const venueRelations = relations(venueTable, ({ many, one }) => ({
// 	events: many(eventTable),
// }))

export const venueSchema = createInsertSchema(venueTable, {
	name: (schema) => schema.name.min(1).default(''),
})
export type Venue = typeof venueTable.$inferSelect
export type VenueSchemaType = typeof venueSchema
