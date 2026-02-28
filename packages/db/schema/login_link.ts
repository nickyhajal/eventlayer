import { relations, sql, type InferModel } from 'drizzle-orm'
import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import { userTable } from './user'

export const loginLinkTable = pgTable('login_link', {
  id: uuid('id')
    .default(sql`extensions.uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  publicId: text('public_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id),
  expires: timestamp('expires', {
    mode: 'string',
  }),
  createdAt: timestamp('created_at', {
    mode: 'string',
  }).defaultNow(),
  updatedAt: timestamp('updated_at', {
    mode: 'string',
  }).defaultNow(),
})

// export const loginLinkSchema = createInsertSchema(loginLinkTable, {
// 	firstName: (schema) => schema.firstName.min(1).default(''),
// 	lastName: (schema) => schema.lastName.min(1).default(''),
// 	email: (schema) => schema.email.email().default(''),
// })
export type LoginLink = typeof loginLinkTable.$inferSelect
// export type LoginLinkSchemaType = typeof
