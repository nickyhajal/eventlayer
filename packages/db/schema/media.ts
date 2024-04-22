import { relations, sql, type InferModel } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { eventUserTable } from './event_user'
import { venueTable } from './venue'

export const mediaTable = pgTable('media', {
	id: uuid('id')
		.default(sql`extensions.uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	userId: text('user_id'),
	type: text('type'),
	title: text('title'),
	descr: text('descr'),
	status: text('status'),
	eventId: uuid('event_id'),
	parentId: uuid('parent_id'),
	parentType: text('parent_type'),
	ext: text('ext'),
	width: integer('width'),
	height: integer('height'),
	path: text('path'),
	ord: integer('ord').default(0),
	dir: text('dir'),
	version: integer('version').default(1),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

// export const mediaRelations = relations(mediaTable, ({ many, one }) => ({
// 	user: many(eventUserTable),
// 	venue: one(venueTable, {
// 		fields: [eventTable.venueId],
// 		references: [venueTable.id],
// 	}),
// }))

export const mediaSchema = createInsertSchema(mediaTable, {
	// name: (schema) => schema.name.min(1).default(''),
})
export type Media = typeof mediaTable.$inferSelect
export type MediaSchemaType = typeof mediaSchema

// export const createEventSchema = eventSchema.extend({})
// export const adminAddEventSchema = createEventSchema.extend({
// 	userId: z.string().optional(),
// 	companyId: z.string(),
// 	action: z.string(),
// })
