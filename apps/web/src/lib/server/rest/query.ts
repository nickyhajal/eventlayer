/**
 * Reusable REST API query utilities for filtering, ordering, and pagination.
 *
 * Usage:
 *   const query = parseQueryParams(url, {
 *     allowedFilters: ['type', 'status'],
 *     allowedOrderBy: ['createdAt', 'firstName', 'lastName'],
 *     defaultOrderBy: 'createdAt',
 *     defaultOrder: 'desc',
 *   })
 *
 *   const results = applyQueryToArray(data, query)
 */

export interface QueryOptions {
	/** Fields that can be filtered on (e.g., ['type', 'status']) */
	allowedFilters?: string[]
	/** Fields that can be ordered by (e.g., ['createdAt', 'name']) */
	allowedOrderBy?: string[]
	/** Default field to order by */
	defaultOrderBy?: string
	/** Default order direction */
	defaultOrder?: 'asc' | 'desc'
	/** Default limit (max items per page) */
	defaultLimit?: number
	/** Maximum allowed limit */
	maxLimit?: number
}

export interface ParsedQuery {
	filters: Record<string, string>
	orderBy: string | null
	order: 'asc' | 'desc'
	limit: number | null
	offset: number
	/** Special filter: only include items where a field is not null */
	hasFilters: string[]
	/** Special filter: only include items where a field is null */
	nullFilters: string[]
}

export interface QueryMeta {
	count: number
	totalCount: number
	limit: number | null
	offset: number
	hasMore: boolean
}

/**
 * Parse query parameters from URL into a structured query object.
 *
 * Supported query parameters:
 * - Field filters: ?type=speaker&status=active
 * - Has filters: ?has=avatar (only items where avatar is not null)
 * - Null filters: ?null=bio (only items where bio is null)
 * - Order: ?orderBy=lastName&order=asc
 * - Pagination: ?limit=20&offset=0
 */
export function parseQueryParams(url: URL, options: QueryOptions = {}): ParsedQuery {
	const {
		allowedFilters = [],
		allowedOrderBy = [],
		defaultOrderBy = null,
		defaultOrder = 'desc',
		defaultLimit = null,
		maxLimit = 100,
	} = options

	const filters: Record<string, string> = {}
	const hasFilters: string[] = []
	const nullFilters: string[] = []

	// Parse field filters
	for (const field of allowedFilters) {
		const value = url.searchParams.get(field)
		if (value !== null) {
			filters[field] = value
		}
	}

	// Parse "has" filters (field not null)
	const hasParam = url.searchParams.get('has')
	if (hasParam) {
		hasFilters.push(...hasParam.split(',').map((s) => s.trim()))
	}

	// Parse "null" filters (field is null)
	const nullParam = url.searchParams.get('null')
	if (nullParam) {
		nullFilters.push(...nullParam.split(',').map((s) => s.trim()))
	}

	// Parse ordering
	let orderBy = url.searchParams.get('orderBy')
	if (orderBy && !allowedOrderBy.includes(orderBy)) {
		orderBy = null // Invalid orderBy, ignore it
	}
	orderBy = orderBy ?? defaultOrderBy

	const orderParam = url.searchParams.get('order')?.toLowerCase()
	const order: 'asc' | 'desc' =
		orderParam === 'asc' || orderParam === 'desc' ? orderParam : defaultOrder

	// Parse pagination
	let limit: number | null = null
	const limitParam = url.searchParams.get('limit')
	if (limitParam !== null) {
		const parsed = parseInt(limitParam, 10)
		if (!isNaN(parsed) && parsed > 0) {
			limit = Math.min(parsed, maxLimit)
		}
	} else if (defaultLimit !== null) {
		limit = defaultLimit
	}

	const offsetParam = url.searchParams.get('offset')
	let offset = 0
	if (offsetParam !== null) {
		const parsed = parseInt(offsetParam, 10)
		if (!isNaN(parsed) && parsed >= 0) {
			offset = parsed
		}
	}

	return {
		filters,
		orderBy,
		order,
		limit,
		offset,
		hasFilters,
		nullFilters,
	}
}

/**
 * Apply parsed query to an array of data.
 * Returns the filtered, sorted, and paginated results along with metadata.
 */
export function applyQueryToArray<T extends Record<string, unknown>>(
	data: T[],
	query: ParsedQuery,
): { data: T[]; meta: QueryMeta } {
	let results = [...data]
	const totalBeforeFiltering = results.length

	// Apply field filters
	for (const [field, value] of Object.entries(query.filters)) {
		results = results.filter((item) => {
			const itemValue = item[field]
			if (itemValue === undefined) return false
			return String(itemValue) === value
		})
	}

	// Apply "has" filters (field not null/undefined/empty)
	for (const field of query.hasFilters) {
		results = results.filter((item) => {
			const value = item[field]
			return value !== null && value !== undefined && value !== ''
		})
	}

	// Apply "null" filters (field is null/undefined/empty)
	for (const field of query.nullFilters) {
		results = results.filter((item) => {
			const value = item[field]
			return value === null || value === undefined || value === ''
		})
	}

	const totalCount = results.length

	// Apply ordering
	if (query.orderBy) {
		const field = query.orderBy
		const direction = query.order === 'asc' ? 1 : -1

		results.sort((a, b) => {
			const aVal = a[field]
			const bVal = b[field]

			// Handle nulls - push to end
			if (aVal === null || aVal === undefined) return 1
			if (bVal === null || bVal === undefined) return -1

			// String comparison
			if (typeof aVal === 'string' && typeof bVal === 'string') {
				return aVal.localeCompare(bVal) * direction
			}

			// Number/date comparison
			if (aVal < bVal) return -1 * direction
			if (aVal > bVal) return 1 * direction
			return 0
		})
	}

	// Apply pagination
	if (query.offset > 0) {
		results = results.slice(query.offset)
	}

	const hasMore = query.limit !== null && results.length > query.limit

	if (query.limit !== null) {
		results = results.slice(0, query.limit)
	}

	return {
		data: results,
		meta: {
			count: results.length,
			totalCount,
			limit: query.limit,
			offset: query.offset,
			hasMore,
		},
	}
}

/**
 * Build query parameters documentation for a specific endpoint.
 * Useful for generating API docs.
 */
export function getQueryParamsDocs(options: QueryOptions): string {
	const lines: string[] = []

	if (options.allowedFilters?.length) {
		lines.push(`Filters: ${options.allowedFilters.join(', ')}`)
	}

	if (options.allowedOrderBy?.length) {
		lines.push(`Order by: ${options.allowedOrderBy.join(', ')}`)
	}

	lines.push('Pagination: limit, offset')
	lines.push('Special: has=<field>, null=<field>')

	return lines.join('\n')
}
