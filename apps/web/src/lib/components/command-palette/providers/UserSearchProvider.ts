import Users from 'lucide-svelte/icons/users'

import { trpc } from '$lib/trpc/client'
import { getMediaUrl } from '@matterloop/util'

import type { SearchProvider, SearchResult } from '../types'

export class UserSearchProvider implements SearchProvider {
	group = 'People'
	groupOrder = 2
	icon = Users

	async search(query: string): Promise<SearchResult[]> {
		const q = query.trim()
		if (q.length < 2) return []

		try {
			const users = await trpc().user.search.query({ q })
			return users.map((user: any) => ({
				id: `user-${user.id}`,
				label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
				sublabel: user.email || '',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: Users,
				avatarUrl: user.photo ? getMediaUrl(user.photo, 'w-64,h-64,fo-face,z-0.8') : undefined,
				avatarFallback: `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`,
				href: `/manage/people/${user.id}`,
			}))
		} catch {
			return []
		}
	}
}
