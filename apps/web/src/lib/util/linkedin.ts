export const normalizeLinkedinPath = (value: unknown) => {
	if (typeof value !== 'string') return ''

	return value
		.trim()
		.replace(/^https?:\/\/(www\.)?linkedin\.com\//i, '')
		.replace(/^linkedin\.com\//i, '')
		.replace(/\?.*$/, '')
		.replace(/\/+$/, '')
}

export const buildLinkedinUrl = (value: unknown) => {
	if (typeof value !== 'string') return ''

	const trimmed = value.trim()
	if (!trimmed) return ''
	if (/^https?:\/\//i.test(trimmed)) return trimmed
	if (/^linkedin\.com\//i.test(trimmed)) return `https://${trimmed}`

	const normalizedPath = normalizeLinkedinPath(trimmed)
	if (!normalizedPath) return ''

	return `https://www.linkedin.com/${normalizedPath}`
}
