import { relations, sql } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'

export const pageTable = pgTable(
	'page',
	{
		id: uuid('id')
			.default(sql`extensions.uuid_generate_v4()`)
			.primaryKey()
			.notNull(),
		userId: text('user_id'),
		type: text('type'),
		path: text('path'),
		status: text('status'),
		eventId: uuid('event_id'),
		parentId: uuid('parent_id'),
		title: text('title'),
		ord: integer('ord'),
		subtitle: text('subtitle'),
		body: text('body'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => {
		return {
			eventPageKeyId: uniqueIndex('event_id_key').on(table.eventId, table.path),
		}
	},
)

export const pageRelations = relations(pageTable, ({ many, one }) => ({
	event: one(eventTable, {
		fields: [pageTable.eventId],
		references: [eventTable.id],
	}),
}))

export const pageSchema = createInsertSchema(pageTable, {
	// name: (schema) => schema.name.min(1).default(''),
})
export type Page = typeof pageTable.$inferSelect
export type PageSchemaType = typeof pageSchema

// export const createEventSchema = eventSchema.extend({})
// export const adminAddEventSchema = createEventSchema.extend({
// 	userId: z.string().optional(),
// 	companyId: z.string(),
// 	action: z.string(),
// })
