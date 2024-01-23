import { relations, sql, type InferModel } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

export const contentTable = pgTable('content', {
	id: uuid('id')
		.default(sql`uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	userId: text('user_id'),
	type: text('type'),
	status: text('status'),
	eventId: uuid('event_id'),
	parentId: uuid('parent_id'),
	title: text('title'),
	subtitle: text('subtitle'),
	body: text('body'),
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

export const contentSchema = createInsertSchema(contentTable, {
	// name: (schema) => schema.name.min(1).default(''),
})
export type Content = typeof contentTable.$inferSelect
export type ContentSchemaType = typeof contentSchema

// export const createEventSchema = eventSchema.extend({})
// export const adminAddEventSchema = createEventSchema.extend({
// 	userId: z.string().optional(),
// 	companyId: z.string(),
// 	action: z.string(),
// })
