import ArrowLeft from 'lucide-svelte/icons/arrow-left'
import ExternalLink from 'lucide-svelte/icons/external-link'
import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard'
import Terminal from 'lucide-svelte/icons/terminal'

import { fuzzyScoreMulti } from '../fuzzyMatch'
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
				keywords: ['back', 'previous', 'return', 'navigate'],
			},
			{
				id: 'cmd-dashboard',
				label: 'Go to Dashboard',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: LayoutDashboard,
				href: '/manage/',
				keywords: ['home', 'dashboard', 'main', 'overview'],
			},
			{
				id: 'cmd-open-site',
				label: 'Open Event Site',
				group: this.group,
				groupOrder: this.groupOrder,
				icon: ExternalLink,
				action: () => window.open('/', '_blank'),
				keywords: ['open', 'site', 'preview', 'view', 'external', 'public'],
			},
		]

		const q = query.trim()
		if (!q) {
			return commands
		}

		return commands
			.map((cmd) => ({
				cmd,
				score: fuzzyScoreMulti(q, cmd.label, ...(cmd.keywords || [])),
			}))
			.filter(({ score }) => score > 0)
			.sort((a, b) => b.score - a.score)
			.map(({ cmd }) => cmd)
	}
}
