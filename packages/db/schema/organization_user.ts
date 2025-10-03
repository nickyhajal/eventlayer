import { relations, sql } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { organizationTable } from './organization'
import { userTable } from './user'
import { venueTable } from './venue'

export const organizationUserTable = pgTable('organization_user', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  status: text('status'),
  userId: uuid('user_id').references(() => userTable.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').references(() => organizationTable.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

// export const venueRelations = relations(venueTable, ({ many, one }) => ({
// 	organizations: many(organizationTable),
// }))

export const venueSchema = createInsertSchema(venueTable, {
  name: (schema) => schema.name.min(1).default(''),
})
export type Venue = typeof venueTable.$inferSelect
export type VenueSchemaType = typeof venueSchema
