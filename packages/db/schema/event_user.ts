import { relations, sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { sponsorTable } from './sponsor'
import { User, userSchema, userTable } from './user'

export const eventUserTable = pgTable('event_user', {
	id: uuid('id')
		.default(sql`uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	type: text('type'),
	status: text('status'),
	proBio: text('pro_bio'),
	bio: text('bio'),
	url: text('url'),
	company: text('company'),
	sponsorId: uuid('sponsor_id').references(() => sponsorTable.id, { onDelete: 'cascade' }),
	title: text('title'),
	userId: uuid('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
	eventId: uuid('event_id').references(() => eventTable.id, { onDelete: 'cascade' }),
	parentId: uuid('parent_id').references(() => eventTable.id, { onDelete: 'cascade' }),
	mainId: uuid('main_id').references(() => eventTable.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

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
