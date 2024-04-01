import { relations, sql } from 'drizzle-orm'
import { pgTable, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { sponsorTable } from './sponsor'
import { User, userSchema, userTable } from './user'
import { eventUserTable } from './event_user'

export const eventUserInfoTable = pgTable('event_user_info', {
	id: uuid('id')
		.default(sql`extensions.uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	type: text('type'),
	key: text('key'),
	value: text('value'),
	public: boolean('public').default(false),
	userId: uuid('user_id'),
	eventId: uuid('event_id'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
}, 
(table) => ({
	userIdeventId: index('event_user_info_user_id_event_id').on(table.userId, table.eventId),
	eventId: index('event_user_info_event_id').on(table.eventId),
}))

export const eventUserRelations = relations(eventUserTable, ({ many, one }) => ({
	event: one(eventTable, {
		fields: [eventUserTable.eventId],
		references: [eventTable.id],
	}),
	user: one(userTable, {
		fields: [eventUserTable.userId],
		references: [userTable.id],
	}),
	sponsor: one(sponsorTable, {
		fields: [eventUserTable.sponsorId],
		references: [sponsorTable.id],
	}),
}))

export const eventUserSchema = createInsertSchema(eventUserTable, {
	type: (schema) => schema.type.min(1).default(''),
})
export const upsertEventUserSchema = userSchema.merge(eventUserSchema)
export type EventUser = typeof eventUserTable.$inferSelect
export type FullEventUser = EventUser & User
// export type eventUserSchemaType = typeof eventUserSchema
export function makeFullEventUser({
	user,
	eventUser,
}: {
	user: User
	eventUser: EventUser
}): FullEventUser {
	return {
		...user,
		...eventUser,
	}
}
