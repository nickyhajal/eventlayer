import Calendar from 'lucide-svelte/icons/calendar'
import FileText from 'lucide-svelte/icons/file-text'
import Handshake from 'lucide-svelte/icons/handshake'
import ListOrdered from 'lucide-svelte/icons/list-ordered'
import Map from 'lucide-svelte/icons/map'
import NotePadText from 'lucide-svelte/icons/notepad-text'
import Paintbrush from 'lucide-svelte/icons/paintbrush'
import Pencil from 'lucide-svelte/icons/pencil'
import Pin from 'lucide-svelte/icons/map-pinned'
import Plus from 'lucide-svelte/icons/plus'
import Send from 'lucide-svelte/icons/send'
import Settings from 'lucide-svelte/icons/settings'
import Sparkles from 'lucide-svelte/icons/sparkles'
import Trash2 from 'lucide-svelte/icons/trash-2'
import Users from 'lucide-svelte/icons/users'

import { fuzzyScoreMulti } from '../fuzzyMatch'
import type { SearchProvider, SearchResult } from '../types'

interface RouteAction {
	id: string
	label: string
	icon: typeof Plus
	href?: string
	keywords?: string[]
}

// Route patterns and their contextual actions
const routeActions: { pattern: RegExp; actions: RouteAction[] }[] = [
	{
		pattern: /^\/manage\/?$/,
		actions: [
			{ id: 'ctx-create-event', label: 'Create Event', icon: Plus, href: '/manage/events', keywords: ['add', 'new', 'event'] },
			{ id: 'ctx-add-person', label: 'Add Person', icon: Plus, href: '/manage/people', keywords: ['add', 'new', 'person', 'attendee'] },
			{ id: 'ctx-edit-settings', label: 'Edit Settings', icon: Settings, href: '/manage/settings', keywords: ['settings', 'configure'] },
		],
	},
	{
		pattern: /^\/manage\/events\/?$/,
		actions: [
			{ id: 'ctx-create-event', label: 'Create Event', icon: Plus, keywords: ['add', 'new', 'event', 'create'] },
		],
	},
	{
		pattern: /^\/manage\/events\/[^/]+$/,
		actions: [
			{ id: 'ctx-edit-event', label: 'Edit Event', icon: Pencil, keywords: ['edit', 'modify', 'update'] },
			{ id: 'ctx-delete-event', label: 'Delete Event', icon: Trash2, keywords: ['delete', 'remove'] },
			{ id: 'ctx-event-attendees', label: 'View Attendees', icon: Users, href: '/manage/people', keywords: ['attendees', 'people', 'users'] },
		],
	},
	{
		pattern: /^\/manage\/people\/?$/,
		actions: [
			{ id: 'ctx-add-person', label: 'Add Person', icon: Plus, keywords: ['add', 'new', 'person', 'attendee', 'create'] },
		],
	},
	{
		pattern: /^\/manage\/people\/[^/]+$/,
		actions: [
			{ id: 'ctx-edit-person', label: 'Edit Person', icon: Pencil, keywords: ['edit', 'modify', 'update'] },
			{ id: 'ctx-send-welcome', label: 'Send Welcome Email', icon: Send, keywords: ['welcome', 'email', 'send', 'invite'] },
		],
	},
	{
		pattern: /^\/manage\/venues\/?$/,
		actions: [
			{ id: 'ctx-add-venue', label: 'Add Venue', icon: Plus, keywords: ['add', 'new', 'venue', 'create'] },
			{ id: 'ctx-reorder-venues', label: 'Reorder Venues', icon: ListOrdered, href: '/manage/venues/order', keywords: ['order', 'sort', 'reorder'] },
			{ id: 'ctx-view-maps', label: 'View Maps', icon: Map, href: '/manage/venues/maps', keywords: ['map', 'maps', 'location'] },
		],
	},
	{
		pattern: /^\/manage\/venues\/[^/]+$/,
		actions: [
			{ id: 'ctx-edit-venue', label: 'Edit Venue', icon: Pencil, keywords: ['edit', 'modify', 'update'] },
		],
	},
	{
		pattern: /^\/manage\/sponsors\/?$/,
		actions: [
			{ id: 'ctx-add-sponsor', label: 'Add Sponsor', icon: Plus, keywords: ['add', 'new', 'sponsor', 'create'] },
			{ id: 'ctx-reorder-sponsors', label: 'Reorder Sponsors', icon: ListOrdered, href: '/manage/sponsors/order', keywords: ['order', 'sort', 'reorder'] },
		],
	},
	{
		pattern: /^\/manage\/sponsors\/[^/]+$/,
		actions: [
			{ id: 'ctx-edit-sponsor', label: 'Edit Sponsor', icon: Pencil, keywords: ['edit', 'modify', 'update'] },
		],
	},
	{
		pattern: /^\/manage\/pages\/?$/,
		actions: [
			{ id: 'ctx-create-page', label: 'Create Page', icon: Plus, keywords: ['add', 'new', 'page', 'create'] },
		],
	},
	{
		pattern: /^\/manage\/pages\/[^/]+$/,
		actions: [
			{ id: 'ctx-edit-page', label: 'Edit Page', icon: Pencil, keywords: ['edit', 'modify', 'update'] },
		],
	},
	{
		pattern: /^\/manage\/forms\/?$/,
		actions: [
			{ id: 'ctx-create-form', label: 'Create Form', icon: Plus, keywords: ['add', 'new', 'form', 'create'] },
		],
	},
	{
		pattern: /^\/manage\/forms\/[^/]+$/,
		actions: [
			{ id: 'ctx-edit-form', label: 'Edit Form', icon: Pencil, keywords: ['edit', 'modify', 'update'] },
		],
	},
	{
		pattern: /^\/manage\/settings\/?$/,
		actions: [
			{ id: 'ctx-edit-appearance', label: 'Edit Appearance', icon: Paintbrush, href: '/manage/settings', keywords: ['appearance', 'theme', 'style'] },
		],
	},
]

export class ContextualSearchProvider implements SearchProvider {
	group = 'Actions'
	groupOrder = -1
	icon = Sparkles
	private pathname: string

	constructor(pathname: string) {
		this.pathname = pathname
	}

	updatePath(pathname: string) {
		this.pathname = pathname
	}

	search(query: string): SearchResult[] {
		const matchingRoute = routeActions.find((r) => r.pattern.test(this.pathname))
		if (!matchingRoute) return []

		const actions = matchingRoute.actions.map(
			(action): SearchResult => ({
				id: action.id,
				label: action.label,
				group: this.group,
				groupOrder: this.groupOrder,
				icon: action.icon,
				href: action.href,
				keywords: action.keywords,
			}),
		)

		const q = query.trim()
		if (!q) {
			return actions
		}

		return actions
			.map((action) => ({
				action,
				score: fuzzyScoreMulti(q, action.label, ...(action.keywords || [])),
			}))
			.filter(({ score }) => score > 0)
			.sort((a, b) => b.score - a.score)
			.map(({ action }) => action)
	}
}
