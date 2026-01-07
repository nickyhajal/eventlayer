import { relations, sql } from 'drizzle-orm'
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'

export const eventApiKeyTable = pgTable(
	'event_api_key',
	{
		id: uuid('id')
			.default(sql`extensions.uuid_generate_v4()`)
			.primaryKey()
			.notNull(),
		eventId: uuid('event_id')
			.notNull()
			.references(() => eventTable.id, { onDelete: 'cascade' }),
		key: text('key').notNull().unique(),
		name: text('name').notNull(),
		permissions: jsonb('permissions'),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	},
	(table) => ({
		eventId: index('event_api_key_event_id').on(table.eventId),
		key: index('event_api_key_key').on(table.key),
	}),
)

export const eventApiKeyRelations = relations(eventApiKeyTable, ({ one }) => ({
	event: one(eventTable, {
		fields: [eventApiKeyTable.eventId],
		references: [eventTable.id],
	}),
}))

export const eventApiKeySchema = createInsertSchema(eventApiKeyTable, {})
export type EventApiKey = typeof eventApiKeyTable.$inferSelect
