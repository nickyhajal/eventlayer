import { error } from '@sveltejs/kit'

import { hashApiKey } from '@matterloop/api/src/router/apiKeyProcedures'
import { and, apiKeyTable, db, eq, isNull } from '@matterloop/db'

/**
 * Validates an API key from the Authorization header and returns the associated event.
 * API keys should be passed as: Authorization: Bearer el_xxxxx
 */
export async function validateApiKey(request: Request) {
	const authHeader = request.headers.get('Authorization')

	if (!authHeader) {
		throw error(401, {
			message: 'Missing Authorization header. Use: Authorization: Bearer <api_key>',
		})
	}

	const [scheme, token] = authHeader.split(' ')

	if (scheme?.toLowerCase() !== 'bearer' || !token) {
		throw error(401, {
			message: 'Invalid Authorization header format. Use: Authorization: Bearer <api_key>',
		})
	}

	if (!token.startsWith('el_')) {
		throw error(401, {
			message: 'Invalid API key format',
		})
	}

	// Hash the provided key and look it up
	const keyHash = hashApiKey(token)

	const apiKey = await db.query.apiKeyTable.findFirst({
		where: and(eq(apiKeyTable.keyHash, keyHash), isNull(apiKeyTable.revokedAt)),
		with: {
			event: true,
		},
	})

	if (!apiKey) {
		throw error(401, {
			message: 'Invalid or revoked API key',
		})
	}

	// Update last used timestamp (fire and forget - no need to await)
	void db
		.update(apiKeyTable)
		.set({ lastUsedAt: new Date().toISOString() })
		.where(eq(apiKeyTable.id, apiKey.id))

	return {
		apiKey,
		event: apiKey.event,
	}
}

/**
 * CORS headers for REST API responses
 */
export function getCorsHeaders(origin: string | null) {
	return {
		'Access-Control-Allow-Origin': origin ?? '*',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': 'Authorization, Content-Type',
		'Access-Control-Max-Age': '86400',
	}
}
