import FileText from 'lucide-svelte/icons/file-text'

import { trpc } from '$lib/trpc/client'

import type { SearchProvider, SearchResult } from '../types'

export class PageSearchProvider implements SearchProvider {
	group = 'Content Pages'
	groupOrder = 5
	icon = FileText

	async search(query: string): Promise<SearchResult[]> {
		const q = query.trim()
		if (q.length < 2) return []

		try {
			const pages = await trpc().page.search.query({ q })
			return pages.map((page: any) => ({
				id: `page-${page.id}`,
				label: page.title || 'Untitled Page',
				sublabel: page.subtitle || page.path || '',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: FileText,
				href: `/manage/pages/${page.id}`,
			}))
		} catch {
			return []
		}
	}
}
