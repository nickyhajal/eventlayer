import { relations, sql, type InferModel } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { contentTable } from './content'
import { eventApiKeyTable } from './event_api_key'
import { eventMetaTable } from './event_meta'
import { eventUserTable } from './event_user'
import { mediaTable } from './media'
import { menuTable } from './menu'
import { venueTable } from './venue'

export const eventTable = pgTable('event', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  name: text('name').notNull(),
  subtitle: text('subtitle'),
  type: text('type').default('main'),
  eventFor: text('event_for').default('all'),
  eventForMeta: text('event_for_meta'),
  showAttendeeList: boolean('show_attendee_list').default(false),
  venueId: uuid('venue_id').references(() => venueTable.id, { onDelete: 'cascade' }),
  eventId: uuid('event_id'),
  mediaId: uuid('mediaId'),
  largeLogoId: uuid('large_logo_id'),
  faviconId: uuid('favicon_id'),
  domainId: text('domain_id').unique(),
  description: text('description'),
  note: text('note'),
  startsAt: timestamp('starts_at', { withTimezone: false, mode: 'string' }),
  endsAt: timestamp('end_at', { withTimezone: false, mode: 'string' }),
  maxAttendees: integer('max_attendees').default(0),
  numAttendees: integer('num_attendees').default(0),
  ord: integer('ord').default(0),
  replyEmail: text('reply_email'),
  internalNotes: text('internal_notes'),
  emailFromName: text('email_from_name'),
  colors: jsonb('colors'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export const eventRelations = relations(eventTable, ({ many, one }) => ({
  users: many(eventUserTable),
  venue: one(venueTable, {
    fields: [eventTable.venueId],
    references: [venueTable.id],
    relationName: 'event_venue',
  }),
  photo: one(mediaTable, {
    fields: [eventTable.mediaId],
    references: [mediaTable.id],
  }),
  favicon: one(mediaTable, {
    fields: [eventTable.faviconId],
    references: [mediaTable.id],
  }),
  largeLogo: one(mediaTable, {
    fields: [eventTable.largeLogoId],
    references: [mediaTable.id],
  }),
  menus: many(menuTable),
  content: many(contentTable),
  eventMeta: many(eventMetaTable),
  apiKeys: many(eventApiKeyTable),
}))

export const eventSchema = createInsertSchema(eventTable, {
  name: (schema) => schema.name.min(1).default(''),
})
export type Event = typeof eventTable.$inferSelect
export type EventSchemaType = typeof eventSchema

// export const createEventSchema = eventSchema.extend({})
// export const adminAddEventSchema = createEventSchema.extend({
// 	userId: z.string().optional(),
// 	companyId: z.string(),
// 	action: z.string(),
// })
