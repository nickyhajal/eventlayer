import { relations, sql } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { User, userSchema, userTable } from './user'

export const eventUserCheckinTable = pgTable(
  'event_user_checkin',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    type: text('type'),
    status: text('status'),
    userId: uuid('user_id'),
    staffId: uuid('staff_id'),
    eventId: uuid('event_id'),
    mainEventId: uuid('main_event_id'),
    venueId: uuid('venue_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    userIdeventIdStatus: index('event_user_checkin_user_id_event_id_status').on(
      table.userId,
      table.eventId,
      table.status,
    ),
    eventId: index('event_user_checkin_event_id').on(table.eventId),
  }),
)

export const eventUserCheckinRelations = relations(eventUserCheckinTable, ({ many, one }) => ({
  event: one(eventTable, {
    fields: [eventUserCheckinTable.eventId],
    references: [eventTable.id],
  }),
  user: one(userTable, {
    fields: [eventUserCheckinTable.userId],
    references: [userTable.id],
  }),
  staff: one(userTable, {
    fields: [eventUserCheckinTable.staffId],
    references: [userTable.id],
  }),
}))

export const eventUserCheckinSchema = createInsertSchema(eventUserCheckinTable, {})
export type EventUserCheckin = typeof eventUserCheckinTable.$inferSelect
// export type eventUserSchemaType = typeof eventUserSchema
