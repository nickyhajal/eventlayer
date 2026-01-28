import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

import type { RequestHandler } from './$types'

// Possible locations for llms.txt relative to process.cwd()
const POSSIBLE_PATHS = [
	'llms.txt', // If running from workspace root
	'../../llms.txt', // If running from apps/web
	'../../../llms.txt', // Alternative path
]

// GET /llms.txt - Serves the API documentation file
export const GET: RequestHandler = async () => {
	let content: string | null = null

	// Try each possible path
	for (const relativePath of POSSIBLE_PATHS) {
		const fullPath = resolve(process.cwd(), relativePath)
		if (existsSync(fullPath)) {
			try {
				content = readFileSync(fullPath, 'utf-8')
				break
			} catch {
				// Continue to next path
			}
		}
	}

	if (!content) {
		return new Response('llms.txt not found', { status: 404 })
	}

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	})
}
