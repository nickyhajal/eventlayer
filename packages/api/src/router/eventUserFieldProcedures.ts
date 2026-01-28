import { initTRPC, TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
	and,
	asc,
	createEventUserFieldSchema,
	db,
	eq,
	eventUserFieldTable,
	or,
	updateEventUserFieldSchema,
} from '@matterloop/db'
import { getId } from '@matterloop/util'

import {
	procedureWithContext,
	verifyAdmin,
	verifyEvent,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

// Generate a URL-safe key from a label
function generateKey(label: string): string {
	return label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.substring(0, 50)
}

export const eventUserFieldProcedures = t.router({
	// List all custom fields for the current event
	list: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.query(async ({ ctx }) => {
			const fields = await db.query.eventUserFieldTable.findMany({
				where: eq(eventUserFieldTable.eventId, ctx.event.id),
				orderBy: [asc(eventUserFieldTable.ord)],
			})
			return fields
		}),

	// Get fields applicable to a specific user (by userId or type)
	getForUser: procedureWithContext
		.use(verifyEvent())
		.input(
			z.object({
				userId: z.string().uuid().optional(),
				userType: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const fields = await db.query.eventUserFieldTable.findMany({
				where: eq(eventUserFieldTable.eventId, ctx.event.id),
				orderBy: [asc(eventUserFieldTable.ord)],
			})

			// Filter fields by scope
			return fields.filter((field) => {
				if (field.scope === 'all') return true
				if (field.scope === 'user' && field.scopeValue === input.userId) return true
				if (field.scope === 'type' && field.scopeValue === input.userType) return true
				return false
			})
		}),

	// Create a new custom field
	create: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(createEventUserFieldSchema)
		.mutation(async ({ ctx, input }) => {
			// Generate a unique key from label
			let baseKey = generateKey(input.label)
			let key = baseKey
			let counter = 1

			// Check for key uniqueness within the event
			while (true) {
				const existing = await db.query.eventUserFieldTable.findFirst({
					where: and(
						eq(eventUserFieldTable.eventId, ctx.event.id),
						eq(eventUserFieldTable.key, key),
					),
				})
				if (!existing) break
				key = `${baseKey}_${counter}`
				counter++
			}

			// Get the max ord to append at the end
			const maxOrdResult = await db.query.eventUserFieldTable.findFirst({
				where: eq(eventUserFieldTable.eventId, ctx.event.id),
				orderBy: (table, { desc }) => [desc(table.ord)],
			})
			const nextOrd = (maxOrdResult?.ord ?? 0) + 1

			const [newField] = await db
				.insert(eventUserFieldTable)
				.values({
					eventId: ctx.event.id,
					key,
					label: input.label,
					fieldType: input.fieldType,
					scope: input.scope,
					scopeValue: input.scopeValue,
					visibility: input.visibility,
					options: input.options,
					ord: nextOrd,
				})
				.returning()

			return newField
		}),

	// Update an existing custom field
	update: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(updateEventUserFieldSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input

			const existing = await db.query.eventUserFieldTable.findFirst({
				where: and(
					eq(eventUserFieldTable.id, id),
					eq(eventUserFieldTable.eventId, ctx.event.id),
				),
			})

			if (!existing) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Custom field not found',
				})
			}

			const [updated] = await db
				.update(eventUserFieldTable)
				.set({
					...updateData,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(eventUserFieldTable.id, id))
				.returning()

			return updated
		}),

	// Delete a custom field
	delete: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.eventUserFieldTable.findFirst({
				where: and(
					eq(eventUserFieldTable.id, input.id),
					eq(eventUserFieldTable.eventId, ctx.event.id),
				),
			})

			if (!existing) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Custom field not found',
				})
			}

			await db.delete(eventUserFieldTable).where(eq(eventUserFieldTable.id, input.id))

			return { success: true }
		}),

	// Reorder fields
	reorder: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(
			z.object({
				orderedIds: z.array(z.string().uuid()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Update ord for each field based on position in array
			await Promise.all(
				input.orderedIds.map((id, index) =>
					db
						.update(eventUserFieldTable)
						.set({ ord: index, updatedAt: new Date().toISOString() })
						.where(
							and(
								eq(eventUserFieldTable.id, id),
								eq(eventUserFieldTable.eventId, ctx.event.id),
							),
						),
				),
			)

			return { success: true }
		}),
})
