import { relations, sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { eventTable } from './event'
import { userTable } from './user'

export const apiKeyTable = pgTable('api_key', {
	id: uuid('id')
		.default(sql`extensions.uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => eventTable.id, { onDelete: 'cascade' }),
	createdById: uuid('created_by_id').references(() => userTable.id),
	name: text('name').notNull(),
	// Store a prefix of the key for display (e.g., "el_abc123...")
	keyPrefix: text('key_prefix').notNull(),
	// Store the hashed version of the full key
	keyHash: text('key_hash').notNull(),
	lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),
	revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export const apiKeyRelations = relations(apiKeyTable, ({ one }) => ({
	event: one(eventTable, {
		fields: [apiKeyTable.eventId],
		references: [eventTable.id],
	}),
	createdBy: one(userTable, {
		fields: [apiKeyTable.createdById],
		references: [userTable.id],
	}),
}))

export const apiKeySchema = createInsertSchema(apiKeyTable, {
	name: (schema) => schema.name.min(1, 'Name is required'),
})

export const createApiKeySchema = z.object({
	name: z.string().min(1, 'Name is required'),
})

export type ApiKey = typeof apiKeyTable.$inferSelect
export type ApiKeySchemaType = typeof apiKeySchema
