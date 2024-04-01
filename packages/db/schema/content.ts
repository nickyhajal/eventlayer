import { relations, sql, type InferModel } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { eventTable } from './event'

export const contentTable = pgTable('content', {
	id: uuid('id')
		.default(sql`extensions.uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	userId: text('user_id'),
	type: text('type'),
	key: text('key'),
	status: text('status'),
	eventId: uuid('event_id'),
	parentId: uuid('parent_id'),
	title: text('title'),
	ord: integer('ord'),
	subtitle: text('subtitle'),
	body: text('body'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		eventContentKeyId: uniqueIndex('event_id_key').on(table.eventId, table.key),
	}
})

export const contentRelations = relations(contentTable, ({ many, one }) => ({
	venue: one(eventTable, {
		fields: [contentTable.eventId],
		references: [eventTable.id],
	}),
}))

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
