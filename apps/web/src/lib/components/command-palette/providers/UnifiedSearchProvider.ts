import Calendar from 'lucide-svelte/icons/calendar'
import FileText from 'lucide-svelte/icons/file-text'
import Handshake from 'lucide-svelte/icons/handshake'
import Pin from 'lucide-svelte/icons/map-pinned'
import Users from 'lucide-svelte/icons/users'

import { trpc } from '$lib/trpc/client'
import { getMediaUrl } from '@matterloop/util'

import type { SearchResult } from '../types'

export class UnifiedSearchProvider {
	async search(query: string): Promise<SearchResult[]> {
		const q = query.trim()
		if (q.length < 2) return []

		try {
			const data = await trpc().search.global.query({ q })
			const results: SearchResult[] = []

			// Users → People group (order 2)
			for (const user of data.users) {
				results.push({
					id: `user-${user.id}`,
					label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
					sublabel: user.email || '',
					group: 'People',
					groupOrder: 2,
					icon: Users,
					avatarUrl: user.photo
						? getMediaUrl(user.photo, 'w-64,h-64,fo-face,z-0.8')
						: undefined,
					avatarFallback: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`,
					href: `/manage/people/${user.id}`,
				})
			}

			// Events (order 3)
			for (const event of data.events) {
				results.push({
					id: `event-${event.id}`,
					label: event.name || 'Untitled Event',
					sublabel: event.subtitle || '',
					group: 'Events',
					groupOrder: 3,
					icon: Calendar,
					href: `/manage/events/${event.id}`,
				})
			}

			// Venues (order 4)
			for (const venue of data.venues) {
				results.push({
					id: `venue-${venue.id}`,
					label: venue.name || 'Untitled Venue',
					sublabel: venue.address || '',
					group: 'Venues',
					groupOrder: 4,
					icon: Pin,
					avatarUrl: (venue as any).photo
						? getMediaUrl((venue as any).photo, 'w-64,h-64,fo-auto')
						: undefined,
					href: `/manage/venues/${venue.id}`,
				})
			}

			// Pages (order 5)
			for (const page of data.pages) {
				results.push({
					id: `page-${page.id}`,
					label: page.title || 'Untitled Page',
					sublabel: page.subtitle || page.path || '',
					group: 'Content Pages',
					groupOrder: 5,
					icon: FileText,
					href: `/manage/pages/${page.id}`,
				})
			}

			// Sponsors (order 6)
			for (const sponsor of data.sponsors) {
				results.push({
					id: `sponsor-${sponsor.id}`,
					label: sponsor.title || 'Untitled Sponsor',
					sublabel: sponsor.url || '',
					group: 'Sponsors',
					groupOrder: 6,
					icon: Handshake,
					avatarUrl: (sponsor as any).photo
						? getMediaUrl((sponsor as any).photo, 'w-64,h-64,fo-auto')
						: undefined,
					href: `/manage/sponsors/${sponsor.id}`,
				})
			}

			return results
		} catch {
			return []
		}
	}
}
