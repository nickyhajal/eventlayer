import Pin from 'lucide-svelte/icons/map-pinned'

import { trpc } from '$lib/trpc/client'
import { getMediaUrl } from '@matterloop/util'

import type { SearchProvider, SearchResult } from '../types'

export class VenueSearchProvider implements SearchProvider {
	group = 'Venues'
	groupOrder = 4
	icon = Pin

	async search(query: string): Promise<SearchResult[]> {
		const q = query.trim()
		if (q.length < 2) return []

		try {
			const venues = await trpc().venue.search.query({ q })
			return venues.map((venue: any) => ({
				id: `venue-${venue.id}`,
				label: venue.name || 'Untitled Venue',
				sublabel: venue.address || '',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: Pin,
				avatarUrl: venue.photo
					? getMediaUrl(venue.photo, 'w-64,h-64,fo-auto')
					: undefined,
				href: `/manage/venues`,
			}))
		} catch {
			return []
		}
	}
}
