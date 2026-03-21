import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'

export const screenProfileTable = pgTable(
  'screen_profile',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => eventTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    mode: text('mode').default('upcoming_events').notNull(),
    notificationEnabled: boolean('notification_enabled').default(false).notNull(),
    notificationMessage: text('notification_message'),
    notificationPosition: text('notification_position').default('top').notNull(),
    messageBody: text('message_body'),
    imageUrl: text('image_url'),
    backgroundStyles: text('background_styles'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    eventScreenProfileName: uniqueIndex('screen_profile_event_id_name_key').on(
      table.eventId,
      table.name,
    ),
  }),
)

export const screenProfileRelations = relations(screenProfileTable, ({ one }) => ({
  event: one(eventTable, {
    fields: [screenProfileTable.eventId],
    references: [eventTable.id],
  }),
}))

export const screenProfileSchema = createInsertSchema(screenProfileTable)
export type ScreenProfile = typeof screenProfileTable.$inferSelect
export type ScreenProfileSchemaType = typeof screenProfileSchema
