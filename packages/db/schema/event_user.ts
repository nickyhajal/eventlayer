import { relations, sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { eventTable } from './event'
import { userTable } from './user'

export const eventUserTable = pgTable('event_user', {
	id: uuid('id')
		.default(sql`uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	type: text('type'),
	status: text('status'),
	userId: uuid('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
	eventId: uuid('event_id').references(() => eventTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

// export const eventUserRelations = relations(eventUserTable, ({ many, one }) => ({
// 	events: many(eventTable),
// }))

// export const eventUserSchema = createInsertSchema(eventUserTable, {
// 	name: (schema) => schema.name.min(1).default(''),
// })
export type eventUser = typeof eventUserTable.$inferSelect
// export type eventUserSchemaType = typeof eventUserSchema
