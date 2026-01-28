import Handshake from 'lucide-svelte/icons/handshake'

import { trpc } from '$lib/trpc/client'
import { getMediaUrl } from '@matterloop/util'

import type { SearchProvider, SearchResult } from '../types'

export class SponsorSearchProvider implements SearchProvider {
	group = 'Sponsors'
	groupOrder = 6
	icon = Handshake

	async search(query: string): Promise<SearchResult[]> {
		const q = query.trim()
		if (q.length < 2) return []

		try {
			const sponsors = await trpc().sponsor.search.query({ q })
			return sponsors.map((sponsor: any) => ({
				id: `sponsor-${sponsor.id}`,
				label: sponsor.title || 'Untitled Sponsor',
				sublabel: sponsor.url || '',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: Handshake,
				avatarUrl: sponsor.photo
					? getMediaUrl(sponsor.photo, 'w-64,h-64,fo-auto')
					: undefined,
				href: `/manage/sponsors`,
			}))
		} catch {
			return []
		}
	}
}
