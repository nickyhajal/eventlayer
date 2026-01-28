import Calendar from 'lucide-svelte/icons/calendar'

import { trpc } from '$lib/trpc/client'

import type { SearchProvider, SearchResult } from '../types'

export class EventSearchProvider implements SearchProvider {
	group = 'Events'
	groupOrder = 3
	icon = Calendar

	async search(query: string): Promise<SearchResult[]> {
		const q = query.trim()
		if (q.length < 2) return []

		try {
			const events = await trpc().event.search.query({ q })
			return events.map((event: any) => ({
				id: `event-${event.id}`,
				label: event.name || 'Untitled Event',
				sublabel: event.subtitle || '',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: Calendar,
				href: `/manage/events/${event.id}`,
			}))
		} catch {
			return []
		}
	}
}
