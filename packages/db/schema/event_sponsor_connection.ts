import { relations, sql } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'
import { sponsorTable } from './sponsor'
import { userTable } from './user'

export const eventSponsorConnectionTable = pgTable(
  'event_sponsor_connection',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    type: text('type'),
    status: text('status'),
    source: text('source'),
    userId: uuid('user_id')
      .references(() => userTable.id, { onDelete: 'cascade' }),
    sponsorId: uuid('sponsor_id')
      .references(() => sponsorTable.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .references(() => eventTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    eventIdIdx: index('event_sponsor_connection_event_id').on(table.eventId),
    sponsorIdIdx: index('event_sponsor_connection_sponsor_id').on(table.sponsorId),
    userIdIdx: index('event_sponsor_connection_user_id').on(table.userId),
    sponsorEventIdx: index('event_sponsor_connection_sponsor_id_event_id').on(
      table.sponsorId,
      table.eventId,
    ),
    userSponsorEventUnique: uniqueIndex('event_sponsor_connection_event_sponsor_user_key').on(
      table.eventId,
      table.sponsorId,
      table.userId,
    ),
  }),
)

export const eventSponsorConnectionRelations = relations(
  eventSponsorConnectionTable,
  ({ one }) => ({
    event: one(eventTable, {
      fields: [eventSponsorConnectionTable.eventId],
      references: [eventTable.id],
    }),
    sponsor: one(sponsorTable, {
      fields: [eventSponsorConnectionTable.sponsorId],
      references: [sponsorTable.id],
    }),
    user: one(userTable, {
      fields: [eventSponsorConnectionTable.userId],
      references: [userTable.id],
    }),
  }),
)

export const eventSponsorConnectionSchema = createInsertSchema(eventSponsorConnectionTable, {})
export type EventSponsorConnection = typeof eventSponsorConnectionTable.$inferSelect
