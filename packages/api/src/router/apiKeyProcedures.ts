import { initTRPC, TRPCError } from '@trpc/server'
import { createHash, randomBytes } from 'crypto'
import { z } from 'zod'

import { and, apiKeyTable, createApiKeySchema, db, eq, isNull } from '@matterloop/db'

import {
	procedureWithContext,
	verifyAdmin,
	verifyEvent,
	type TrpcContext,
} from '../procedureWithContext'

const t = initTRPC.context<TrpcContext>().create()

// Generate a secure API key with prefix
function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
	const randomPart = randomBytes(32).toString('base64url')
	const fullKey = `el_${randomPart}`
	const prefix = `el_${randomPart.slice(0, 8)}...`
	const hash = createHash('sha256').update(fullKey).digest('hex')
	return { fullKey, prefix, hash }
}

// Hash an API key for comparison
export function hashApiKey(key: string): string {
	return createHash('sha256').update(key).digest('hex')
}

export const apiKeyProcedures = t.router({
	// List all API keys for the current event (only shows non-revoked keys)
	list: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.query(async ({ ctx }) => {
			const keys = await db.query.apiKeyTable.findMany({
				where: and(eq(apiKeyTable.eventId, ctx.event.id), isNull(apiKeyTable.revokedAt)),
				orderBy: (table, { desc }) => [desc(table.createdAt)],
			})
			// Return safe data (no hash)
			return keys.map((key) => ({
				id: key.id,
				name: key.name,
				keyPrefix: key.keyPrefix,
				lastUsedAt: key.lastUsedAt,
				createdAt: key.createdAt,
			}))
		}),

	// Create a new API key
	create: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(createApiKeySchema)
		.mutation(async ({ ctx, input }) => {
			const { fullKey, prefix, hash } = generateApiKey()

			const [newKey] = await db
				.insert(apiKeyTable)
				.values({
					eventId: ctx.event.id,
					createdById: ctx.meId,
					name: input.name,
					keyPrefix: prefix,
					keyHash: hash,
				})
				.returning()

			// Return the full key only once - it cannot be retrieved again
			return {
				id: newKey.id,
				name: newKey.name,
				keyPrefix: newKey.keyPrefix,
				createdAt: newKey.createdAt,
				// This is the only time the full key is returned
				apiKey: fullKey,
			}
		}),

	// Revoke an API key
	revoke: procedureWithContext
		.use(verifyAdmin())
		.use(verifyEvent())
		.input(z.object({ id: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await db.query.apiKeyTable.findFirst({
				where: and(eq(apiKeyTable.id, input.id), eq(apiKeyTable.eventId, ctx.event.id)),
			})

			if (!existing) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'API key not found',
				})
			}

			await db
				.update(apiKeyTable)
				.set({ revokedAt: new Date().toISOString() })
				.where(eq(apiKeyTable.id, input.id))

			return { success: true }
		}),
})
