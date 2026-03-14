import { relations, sql } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { eventTable } from './event'

export const screenTable = pgTable(
  'screen',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => eventTable.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    name: text('name').notNull(),
    status: text('status').default('active'),
    isSystem: boolean('is_system').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    eventScreenKey: uniqueIndex('screen_event_id_key').on(table.eventId, table.key),
  }),
)

export const screenRelations = relations(screenTable, ({ one }) => ({
  event: one(eventTable, {
    fields: [screenTable.eventId],
    references: [eventTable.id],
  }),
}))

export const screenSchema = createInsertSchema(screenTable, {
  key: (schema) => schema.key.min(1),
  name: (schema) => schema.name.min(1),
})

export const screenModeEnum = z.enum(['upcoming_events', 'message'])
export const screenNotificationPositionEnum = z.enum(['top', 'bottom'])

export type ScreenMode = z.infer<typeof screenModeEnum>
export type ScreenNotificationPosition = z.infer<typeof screenNotificationPositionEnum>
export type Screen = typeof screenTable.$inferSelect
export type ScreenSchemaType = typeof screenSchema
