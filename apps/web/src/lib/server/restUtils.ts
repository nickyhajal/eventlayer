import { z } from 'zod'

// Standard query parameter schema for all REST endpoints
export const restQuerySchema = z.object({
	// Pagination
	limit: z.coerce.number().int().min(1).max(100).optional().default(50),
	offset: z.coerce.number().int().min(0).optional().default(0),
	page: z.coerce.number().int().min(1).optional(),

	// Sorting
	sortBy: z.string().optional(),
	sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
})

export type RestQueryParams = z.infer<typeof restQuerySchema>

/**
 * Parse and validate REST API query parameters from URL
 */
export function parseRestQuery(url: URL): RestQueryParams {
	const params = {
		limit: url.searchParams.get('limit'),
		offset: url.searchParams.get('offset'),
		page: url.searchParams.get('page'),
		sortBy: url.searchParams.get('sortBy'),
		sortOrder: url.searchParams.get('sortOrder'),
	}

	const parsed = restQuerySchema.parse(params)

	// If page is provided, calculate offset from page number
	if (parsed.page) {
		parsed.offset = (parsed.page - 1) * parsed.limit
	}

	return parsed
}

/**
 * Parse filter parameters from URL
 * Supports: ?filter.field=value for direct field filtering
 * Supports: ?filter.meta.key=value for metadata filtering
 */
export function parseFilters(url: URL): {
	fields: Record<string, string>
	meta: Record<string, string>
} {
	const fields: Record<string, string> = {}
	const meta: Record<string, string> = {}

	url.searchParams.forEach((value, key) => {
		// Parse filter.meta.key=value for metadata filters
		if (key.startsWith('filter.meta.')) {
			const metaKey = key.substring('filter.meta.'.length)
			meta[metaKey] = value
		}
		// Parse filter.field=value for direct field filters
		else if (key.startsWith('filter.')) {
			const fieldKey = key.substring('filter.'.length)
			fields[fieldKey] = value
		}
	})

	return { fields, meta }
}

/**
 * Calculate pagination metadata
 */
export function getPaginationMeta(
	total: number,
	limit: number,
	offset: number,
): {
	total: number
	limit: number
	offset: number
	page: number
	totalPages: number
	hasNext: boolean
	hasPrev: boolean
} {
	const page = Math.floor(offset / limit) + 1
	const totalPages = Math.ceil(total / limit)

	return {
		total,
		limit,
		offset,
		page,
		totalPages,
		hasNext: offset + limit < total,
		hasPrev: offset > 0,
	}
}
