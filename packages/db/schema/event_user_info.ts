import { relations, sql } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { User, userSchema, userTable } from './user'

export const eventUserInfoTable = pgTable(
  'event_user_info',
  {
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
    userIdeventIdkey: unique('event_user_info_user_id_event_id_key').on(
      table.userId,
      table.eventId,
      table.key,
    ),
    eventId: index('event_user_info_event_id').on(table.eventId),
  }),
)

export const eventUserInfoRelations = relations(eventUserInfoTable, ({ many, one }) => ({
  event: one(eventTable, {
    fields: [eventUserInfoTable.eventId],
    references: [eventTable.id],
  }),
  user: one(userTable, {
    fields: [eventUserInfoTable.userId],
    references: [userTable.id],
  }),
}))

export const eventUserInfoSchema = createInsertSchema(eventUserInfoTable, {})
export type EventUserInfo = typeof eventUserInfoTable.$inferSelect
// export type eventUserSchemaType = typeof eventUserSchema
