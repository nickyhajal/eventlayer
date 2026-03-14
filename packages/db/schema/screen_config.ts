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
import { screenTable } from './screen'

export const screenConfigTable = pgTable(
  'screen_config',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => eventTable.id, { onDelete: 'cascade' }),
    screenId: uuid('screen_id')
      .notNull()
      .references(() => screenTable.id, { onDelete: 'cascade' }),
    mode: text('mode').default('upcoming_events').notNull(),
    notificationEnabled: boolean('notification_enabled').default(false).notNull(),
    notificationMessage: text('notification_message'),
    notificationPosition: text('notification_position').default('top').notNull(),
    messageBody: text('message_body'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    oneConfigPerScreen: uniqueIndex('screen_config_screen_id_key').on(table.screenId),
  }),
)

export const screenConfigRelations = relations(screenConfigTable, ({ one }) => ({
  event: one(eventTable, {
    fields: [screenConfigTable.eventId],
    references: [eventTable.id],
  }),
  screen: one(screenTable, {
    fields: [screenConfigTable.screenId],
    references: [screenTable.id],
  }),
}))

export const screenConfigSchema = createInsertSchema(screenConfigTable)
export type ScreenConfig = typeof screenConfigTable.$inferSelect
export type ScreenConfigSchemaType = typeof screenConfigSchema
