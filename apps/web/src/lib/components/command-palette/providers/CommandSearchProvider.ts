import ArrowLeft from 'lucide-svelte/icons/arrow-left'
import ExternalLink from 'lucide-svelte/icons/external-link'
import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard'
import Terminal from 'lucide-svelte/icons/terminal'

import type { SearchProvider, SearchResult } from '../types'

export class CommandSearchProvider implements SearchProvider {
	group = 'Commands'
	groupOrder = 1
	icon = Terminal

	search(query: string): SearchResult[] {
		const commands: SearchResult[] = [
			{
				id: 'cmd-back',
				label: 'Go Back',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: ArrowLeft,
				action: () => history.back(),
				keywords: ['back', 'previous', 'return'],
			},
			{
				id: 'cmd-dashboard',
				label: 'Go to Dashboard',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: LayoutDashboard,
				href: '/manage/',
				keywords: ['home', 'dashboard', 'main'],
			},
			{
				id: 'cmd-open-site',
				label: 'Open Event Site',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: ExternalLink,
				action: () => window.open('/', '_blank'),
				keywords: ['open', 'site', 'preview', 'view', 'external'],
			},
		]

		const q = query.toLowerCase().trim()
		if (!q) {
			return commands
		}

		return commands.filter((cmd) => {
			const label = cmd.label.toLowerCase()
			const keywords = (cmd.keywords || []).join(' ').toLowerCase()
			return label.includes(q) || keywords.includes(q)
		})
	}
}
