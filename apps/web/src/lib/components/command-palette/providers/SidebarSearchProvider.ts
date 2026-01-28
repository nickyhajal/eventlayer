import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard'

import { sidebarLinks } from '../sidebarLinks'
import type { SearchProvider, SearchResult } from '../types'

export class SidebarSearchProvider implements SearchProvider {
	group = 'Navigate'
	groupOrder = 0
	icon = LayoutDashboard

	search(query: string): SearchResult[] {
		const navigableLinks = sidebarLinks.filter((link) => !link.section && link.path)
		const q = query.toLowerCase().trim()

		const toResult = (link: (typeof navigableLinks)[0]): SearchResult => ({
			id: `sidebar-${link.label.toLowerCase().replace(/\s+/g, '-')}`,
			label: link.label,
			group: this.group,
			groupOrder: this.groupOrder,
			icon: link.icon,
			href: `/manage${link.path}`,
		})

		if (!q) {
			return navigableLinks.map(toResult)
		}

		return navigableLinks
			.filter((link) => {
				const label = link.label.toLowerCase()
				const path = (link.path || '').toLowerCase()
				return label.includes(q) || path.includes(q)
			})
			.map(toResult)
	}
}
