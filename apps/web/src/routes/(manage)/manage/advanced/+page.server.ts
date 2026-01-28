import { error } from '@sveltejs/kit'

import { and, apiKeyTable, asc, db, eq, eventUserFieldTable, isNull } from '@matterloop/db'

export const load = async ({ locals }) => {
	if (!locals.event?.id) {
		error(404, 'Event not found')
	}

	// Load API keys for this event
	const apiKeys = await db.query.apiKeyTable.findMany({
		where: and(eq(apiKeyTable.eventId, locals.event.id), isNull(apiKeyTable.revokedAt)),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
	})

	// Load custom user fields for this event
	const customFields = await db.query.eventUserFieldTable.findMany({
		where: eq(eventUserFieldTable.eventId, locals.event.id),
		orderBy: [asc(eventUserFieldTable.ord)],
	})

	// Return safe data (no hash for API keys)
	return {
		apiKeys: apiKeys.map((key) => ({
			id: key.id,
			name: key.name,
			keyPrefix: key.keyPrefix,
			lastUsedAt: key.lastUsedAt,
			createdAt: key.createdAt,
		})),
		customFields,
	}
}
