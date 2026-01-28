/**
 * Lightweight fuzzy matching utility for command palette search.
 *
 * Scoring:
 *   4 — exact match (query equals text)
 *   3 — prefix match ("das" → "Dashboard")
 *   2 — word-boundary match ("adv" → "Advanced Settings")
 *   1 — subsequence match ("fq" → "FAQs", "ppl" → "People")
 *   0 — no match
 */

export function fuzzyScore(query: string, text: string): number {
	const q = query.toLowerCase()
	const t = text.toLowerCase()

	if (!q) return 1 // Empty query matches everything with base score
	if (t === q) return 4
	if (t.startsWith(q)) return 3

	// Word-boundary match: check if query matches the start of any word
	const words = t.split(/[\s\-_/]+/)
	for (const word of words) {
		if (word.startsWith(q)) return 2
	}

	// Multi-word prefix: check if query tokens each match start of a word
	const queryTokens = q.split(/\s+/)
	if (queryTokens.length > 1) {
		const allMatch = queryTokens.every((qt) => words.some((w) => w.startsWith(qt)))
		if (allMatch) return 2
	}

	// Acronym match: first letters of each word ("ms" → "Menu Square")
	if (words.length > 1) {
		const acronym = words.map((w) => w[0] || '').join('')
		if (acronym.startsWith(q)) return 2
	}

	// Subsequence match: all query chars appear in order in text
	let qi = 0
	for (let ti = 0; ti < t.length && qi < q.length; ti++) {
		if (t[ti] === q[qi]) {
			qi++
		}
	}
	if (qi === q.length) return 1

	return 0
}

/**
 * Score a query against multiple text fields, returning the highest score.
 */
export function fuzzyScoreMulti(query: string, ...texts: (string | undefined)[]): number {
	let best = 0
	for (const text of texts) {
		if (text) {
			const score = fuzzyScore(query, text)
			if (score > best) best = score
		}
	}
	return best
}
