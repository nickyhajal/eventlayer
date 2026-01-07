import { relations, sql } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'

export const eventMetaTable = pgTable(
	'event_meta',
	{
		id: uuid('id')
			.default(sql`extensions.uuid_generate_v4()`)
			.primaryKey()
			.notNull(),
		type: text('type'),
		key: text('key'),
		value: text('value'),
		public: boolean('public').default(false),
		eventId: uuid('event_id'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => ({
		eventId: index('event_meta_event_id').on(table.eventId),
		eventIdKey: unique('event_meta_event_id_key').on(table.eventId, table.key),
	}),
)

export const eventMetaRelations = relations(eventMetaTable, ({ many, one }) => ({
	event: one(eventTable, {
		fields: [eventMetaTable.eventId],
		references: [eventTable.id],
	}),
}))

export const eventMetaSchema = createInsertSchema(eventMetaTable, {})
export type EventMeta = typeof eventMetaTable.$inferSelect
