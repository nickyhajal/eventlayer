import { relations, sql, type InferModel } from 'drizzle-orm'
import { AnyPgColumn, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { mediaTable } from './media'

export const venueTable = pgTable('venue', {
	id: uuid('id')
		.default(sql`extensions.uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	name: text('name'),
	type: text('type'),
	description: text('description'),
	eventId: uuid('event_id').references((): AnyPgColumn => eventTable.id, { onDelete: 'cascade' }),
	venueId: uuid('venue_id').references((): AnyPgColumn => venueTable.id, { onDelete: 'cascade' }),
	maxAttendees: integer('max_attendees'),
	address: text('address'),
	street: text('street'),
	city: text('city'),
	region: text('region'),
	country: text('country'),
	postalCode: text('postal_code'),
	mediaId: uuid('mediaId'),
	lat: text('lat'),
	lon: text('lon'),
	ord: integer('ord'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export const venueRelations = relations(venueTable, ({ many, one }) => ({
	events: many(eventTable),
	photo: one(mediaTable, {
		fields: [venueTable.mediaId],
		references: [mediaTable.id],
	}),
	parent: one(venueTable, {
		fields: [venueTable.venueId],
		references: [venueTable.id],
		relationName: 'parent_child',
	}),
	children: many(venueTable, { relationName: 'parent_child' }),
	event: one(eventTable, {
		fields: [venueTable.eventId],
		references: [eventTable.id],
	}),
}))
export const venueSchema = createInsertSchema(venueTable, {
	name: (schema) => schema.name.min(1).default(''),
})
export type Venue = typeof venueTable.$inferSelect
export type VenueSchemaType = typeof venueSchema
