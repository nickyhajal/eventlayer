import { relations, sql, type InferModel } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { venueTable } from './venue'

export const organizationTable = pgTable('organization', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  numorganizations: integer('num_organizations').default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export const organizationSchema = createInsertSchema(organizationTable, {
  name: (schema) => schema.name.min(1).default(''),
})
export type organization = typeof organizationTable.$inferSelect
export type organizationSchemaType = typeof organizationSchema

// export const createorganizationSchema = organizationSchema.extend({})
// export const adminAddorganizationSchema = createorganizationSchema.extend({
// 	userId: z.string().optional(),
// 	companyId: z.string(),
// 	action: z.string(),
// })
