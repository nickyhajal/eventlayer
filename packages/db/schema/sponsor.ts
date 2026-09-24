import { relations, sql } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventUserTable } from './event_user'
import { mediaTable } from './media'

export const sponsorTable = pgTable('sponsor', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  type: text('type'),
  // 'deleted' hides the sponsor everywhere; rows are kept so reps, hearts and leads survive
  status: text('status'),
  // Private sponsors only show in manage. Existing rows default to public; new ones are created private
  isPublic: boolean('is_public').notNull().default(true),
  eventId: uuid('event_id'),
  mediaId: uuid('media_id'),
  title: text('title'),
  expoLocation: text('expo_location'),
  settings: jsonb('settings'),
  url: text('url'),
  ord: integer('ord'),
  bookingUrl: text('booking_url'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export const sponsorRelations = relations(sponsorTable, ({ many, one }) => ({
  photo: one(mediaTable, {
    fields: [sponsorTable.mediaId],
    references: [mediaTable.id],
  }),
  users: many(eventUserTable),
}))

export const sponsorSchema = createInsertSchema(sponsorTable, {
  // name: (schema) => schema.name.min(1).default(''),
})
export type Sponsor = typeof sponsorTable.$inferSelect
export type SponsorSchemaType = typeof sponsorSchema

// export const createEventSchema = eventSchema.extend({})
// export const adminAddEventSchema = createEventSchema.extend({
// 	userId: z.string().optional(),
// 	companyId: z.string(),
// 	action: z.string(),
// })
