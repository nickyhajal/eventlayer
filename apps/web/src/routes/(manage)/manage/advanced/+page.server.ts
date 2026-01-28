import { error } from '@sveltejs/kit'

import { and, apiKeyTable, db, eq, isNull } from '@matterloop/db'

export const load = async ({ locals }) => {
	if (!locals.event?.id) {
		error(404, 'Event not found')
	}

	// Load API keys for this event
	const apiKeys = await db.query.apiKeyTable.findMany({
		where: and(eq(apiKeyTable.eventId, locals.event.id), isNull(apiKeyTable.revokedAt)),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
	})

	// Return safe data (no hash)
	return {
		apiKeys: apiKeys.map((key) => ({
			id: key.id,
			name: key.name,
			keyPrefix: key.keyPrefix,
			lastUsedAt: key.lastUsedAt,
			createdAt: key.createdAt,
		})),
	}
}
