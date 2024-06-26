import { relations, sql, type InferModel } from 'drizzle-orm'
import {
	bigint,
	boolean,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export const userTable = pgTable(
	'auth_user',
	{
		id: uuid('id')
			.default(sql`extensions.uuid_generate_v4()`)
			.primaryKey()
			.notNull(),
		firstName: text('first_name'),
		lastName: text('last_name'),
		email: text('email'),
		password: text('password'),
		canCreateCompany: boolean('can_create_company'),
		isSuperAdmin: boolean('is_super_admin'),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		}).defaultNow(),
	},
	(table) => {
		return {
			emailKey: uniqueIndex('user_email_key').on(table.email),
		}
	},
)

export const session = pgTable('auth_session', {
	id: varchar('id', {
		length: 128,
	}).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => userTable.id),
	activeExpires: bigint('active_expires', {
		mode: 'number',
	}).notNull(),
	idleExpires: bigint('idle_expires', {
		mode: 'number',
	}).notNull(),
})

export const key = pgTable('auth_key', {
	id: varchar('id', {
		length: 255,
	}).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => userTable.id),
	// primaryKey: boolean('primary_key').notNull(),
	hashedPassword: text('hashed_password'),
	expires: bigint('expires', {
		mode: 'number',
	}),
})

export const passwordResetTable = pgTable('password_reset_token', {
	id: uuid('id').notNull().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => userTable.id),
	expires: bigint('expires', {
		mode: 'number',
	}),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'string',
	}).defaultNow(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'string',
	}).defaultNow(),
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

// export const userRelations = relations(userTable, ({ many, one }) => ({
// tasks: many(taskTable),
// }))
