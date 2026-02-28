import { relations, sql } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { eventTable } from './event'
import { userSchema, userTable } from './user'

export const eventTicketTable = pgTable('event_ticket', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  type: text('type'),
  status: text('status').default('paid'),
  userId: uuid('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id').references(() => eventTable.id, { onDelete: 'cascade' }),
  assignedTo: uuid('assigned_to'),
  assignKey: uuid('assign_id').default(sql`extensions.uuid_generate_v4()`),
  assignKeyGeneratedOn: timestamp('assign_key_generated_on', {
    withTimezone: true,
    mode: 'string',
  }).defaultNow(),
  assignedOn: timestamp('assigned_on', { withTimezone: true, mode: 'string' }),

  // Tracking a mainEventId when a user RSVPs to a sub-event
  mainId: uuid('main_id').references(() => eventTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export const eventTicketRelations = relations(eventTicketTable, ({ many, one }) => ({
  event: one(eventTable, {
    fields: [eventTicketTable.eventId],
    references: [eventTable.id],
  }),
  user: one(userTable, {
    fields: [eventTicketTable.userId],
    references: [userTable.id],
  }),
  assignedToUser: one(userTable, {
    fields: [eventTicketTable.assignedTo],
    references: [userTable.id],
  }),
}))

export const eventTicketSchema = createInsertSchema(eventTicketTable, {
  type: (schema) => schema.type.min(1).default(''),
})
export const upsertEventTicketSchema = userSchema.merge(eventTicketSchema).extend({
  info: z.record(z.string(), z.object({ value: z.string() })).optional(),
})
export type EventTicket = typeof eventTicketTable.$inferSelect
