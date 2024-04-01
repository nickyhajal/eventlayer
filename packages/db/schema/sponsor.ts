import { relations, sql, type InferModel } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventUserTable } from './event_user'
import { mediaTable } from './media'

export const sponsorTable = pgTable('sponsor', {
	id: uuid('id')
		.default(sql`extensions.uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	type: text('type'),
	status: text('status'),
	eventId: uuid('event_id'),
	mediaId: uuid('media_id'),
	title: text('title'),
	expoLocation: text('expo_location'),
	url: text('url'),
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
