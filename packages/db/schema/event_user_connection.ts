import { relations, sql } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { User, userSchema, userTable } from './user'

export const eventUserConnectionTable = pgTable(
  'event_user_connection',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    type: text('type'),
    status: text('status'),
    fromId: uuid('from_id'),
    toId: uuid('to_id'),
    eventId: uuid('event_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    userIdeventIdStatus: index('event_user_connection_user_id_event_id_status').on(
      table.fromId,
      table.eventId,
    ),
    eventId: index('event_user_connection_event_id').on(table.eventId),
  }),
)

export const eventUserConnectionRelations = relations(
  eventUserConnectionTable,
  ({ many, one }) => ({
    event: one(eventTable, {
      fields: [eventUserConnectionTable.eventId],
      references: [eventTable.id],
    }),
    from: one(userTable, {
      fields: [eventUserConnectionTable.fromId],
      references: [userTable.id],
    }),
    to: one(userTable, {
      fields: [eventUserConnectionTable.toId],
      references: [userTable.id],
    }),
  }),
)

export const eventUserConnectionSchema = createInsertSchema(eventUserConnectionTable, {})
export type EventUserConnection = typeof eventUserConnectionTable.$inferSelect
// export type eventUserSchemaType = typeof eventUserSchema
