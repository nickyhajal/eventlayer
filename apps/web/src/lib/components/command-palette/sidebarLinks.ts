import Calendar from 'lucide-svelte/icons/calendar'
import FileQuestion from 'lucide-svelte/icons/file-question'
import FileText from 'lucide-svelte/icons/file-text'
import Handshake from 'lucide-svelte/icons/handshake'
import Home from 'lucide-svelte/icons/home'
import KeyRound from 'lucide-svelte/icons/key-round'
import Pin from 'lucide-svelte/icons/map-pinned'
import SquareMenu from 'lucide-svelte/icons/menu-square'
import NotePadText from 'lucide-svelte/icons/notepad-text'
import Paintbrush from 'lucide-svelte/icons/paintbrush'
import Settings from 'lucide-svelte/icons/settings'
import TextCursor from 'lucide-svelte/icons/text-cursor-input'
import Ticket from 'lucide-svelte/icons/ticket'
import Users from 'lucide-svelte/icons/users'

import type { ComponentType } from 'svelte'

export interface SidebarLink {
	path?: string
	label: string
	icon?: ComponentType
	iconClass?: string
	section?: boolean
}

export const sidebarLinks: SidebarLink[] = [
	{
		path: '/',
		label: 'Dashboard',
		icon: Home,
	},
	{
		section: true,
		label: 'Scheduling',
	},
	{
		path: '/events',
		label: 'Events',
		icon: Calendar,
		iconClass: 'mb-0.5',
	},
	{
		path: '/venues',
		label: 'Venues',
		icon: Pin,
	},
	{
		section: true,
		label: 'Attendees',
	},
	{
		path: '/people',
		label: 'People',
		icon: Users,
	},
	{
		path: '/tickets',
		label: 'Tickets',
		icon: Ticket,
	},
	{
		path: '/forms',
		label: 'Forms',
		icon: NotePadText,
	},
	{
		path: '/sponsors',
		label: 'Sponsors',
		icon: Handshake,
	},
	{
		section: true,
		label: 'Content',
	},
	{
		path: '/pages',
		label: 'Pages',
		icon: FileText,
	},
	{
		path: '/content',
		label: 'Strings',
		icon: TextCursor,
	},
	{
		path: '/faqs',
		label: 'FAQs',
		icon: FileQuestion,
	},
	{
		section: true,
		label: 'Settings',
	},
	{
		path: '/settings',
		label: 'Basics',
		icon: Settings,
	},
	{
		path: '/menus',
		label: 'Menus',
		icon: SquareMenu,
	},
	{
		path: '/settings',
		label: 'Appearance',
		icon: Paintbrush,
	},
	{
		path: '/advanced',
		label: 'Advanced',
		icon: KeyRound,
	},
]
