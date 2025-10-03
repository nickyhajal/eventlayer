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
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

import { mediaTable } from './media'

export const userTable = pgTable(
  'auth_user',
  {
    id: uuid('id')
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    mediaId: uuid('media_id'),
    email: text('email'),
    isSuperAdmin: boolean('is_super_admin'),
    settings: jsonb('settings'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => {
    return {
      emailKey: uniqueIndex('user_email_key').on(table.email),
    }
  },
)

export const userRelations = relations(userTable, ({ many, one }) => ({
  photo: one(mediaTable, {
    fields: [userTable.mediaId],
    references: [mediaTable.id],
  }),
}))
export const authSessionTable = pgTable('auth_session', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at', {
    mode: 'date',
  }).notNull(),
})

export const key = pgTable('auth_key', {
  id: varchar('id', {
    length: 255,
  }).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => userTable.id),
  hashedPassword: text('hashed_password'),
  expires: bigint('expires', {
    mode: 'number',
  }),
})

export const userSchema = createInsertSchema(userTable, {
  firstName: (schema) => schema.firstName.min(1).default(''),
  lastName: (schema) => schema.lastName.min(1).default(''),
  email: (schema) => schema.email.email().default(''),
})
export type User = typeof userTable.$inferSelect
export type UserSchemaType = typeof userSchema

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const createUserSchema = userSchema.extend({})
export const adminAddCompanyUserSchema = createUserSchema.extend({
  userId: z.string().optional(),
  companyId: z.string(),
  action: z.string(),
})

export interface Context {
  meId?: string
  me?: User
}
