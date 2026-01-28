import { relations, sql } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { eventTable } from './event'
import { userTable } from './user'

export const eventUserFieldTable = pgTable(
	'event_user_field',
	{
		id: uuid('id')
			.default(sql`extensions.uuid_generate_v4()`)
			.primaryKey()
			.notNull(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => eventTable.id, { onDelete: 'cascade' }),
		key: text('key').notNull(), // auto-generated slug from label
		label: text('label').notNull(),
		fieldType: text('field_type').default('text'), // text|textarea|boolean|options
		scope: text('scope').default('all'), // all|user|type
		scopeValue: text('scope_value'), // userId or type name (e.g., 'speaker')
		visibility: text('visibility').default('admin'), // admin|attendee|public
		options: text('options'), // comma-separated for options type
		ord: integer('ord').default(0),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => ({
		eventKey: unique('event_user_field_event_key').on(table.eventId, table.key),
	}),
)

export const eventUserFieldRelations = relations(eventUserFieldTable, ({ one }) => ({
	event: one(eventTable, {
		fields: [eventUserFieldTable.eventId],
		references: [eventTable.id],
	}),
}))

export const eventUserFieldSchema = createInsertSchema(eventUserFieldTable, {
	label: (schema) => schema.label.min(1, 'Label is required'),
	key: (schema) => schema.key.min(1, 'Key is required'),
})

export const createEventUserFieldSchema = z.object({
	label: z.string().min(1, 'Label is required'),
	fieldType: z.enum(['text', 'textarea', 'boolean', 'options']).default('text'),
	scope: z.enum(['all', 'user', 'type']).default('all'),
	scopeValue: z.string().optional(),
	visibility: z.enum(['admin', 'attendee', 'public']).default('admin'),
	options: z.string().optional(),
})

export const updateEventUserFieldSchema = createEventUserFieldSchema.partial().extend({
	id: z.string().uuid(),
})

export type EventUserField = typeof eventUserFieldTable.$inferSelect
export type EventUserFieldSchemaType = typeof eventUserFieldSchema
