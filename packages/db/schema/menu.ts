import { relations, sql } from 'drizzle-orm'
import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'

import { eventTable } from './event'

export const menuTable = pgTable('menu', {
	id: uuid('id')
		.default(sql`extensions.uuid_generate_v4()`)
		.primaryKey()
		.notNull(),
	type: text('type'),
	location: text('location'),
	context: text('context'),
	link: text('link'),
	icon: text('icon'),
	props: jsonb('props'),
	status: text('status').default('active'),
	eventId: uuid('event_id'),
	parentId: uuid('parent_id'),
	label: text('label'),
	ord: integer('ord'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
})

export const menuRelations = relations(menuTable, ({ many, one }) => ({
	event: one(eventTable, {
		fields: [menuTable.eventId],
		references: [eventTable.id],
	}),
}))

export const menuSchema = createInsertSchema(menuTable, {
	// name: (schema) => schema.name.min(1).default(''),
})
interface MenuProps {
	className: string
}
export type Menu = typeof menuTable.$inferSelect
export type MenuSchemaType = typeof menuSchema

// export const createEventSchema = eventSchema.extend({})
// export const adminAddEventSchema = createEventSchema.extend({
// 	userId: z.string().optional(),
// 	companyId: z.string(),
// 	action: z.string(),
// })
