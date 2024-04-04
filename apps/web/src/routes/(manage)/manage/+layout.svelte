<script lang="ts">
import { page } from '$app/stores'
import Button from '$lib/components/ui/button/button.svelte'
import BadgeCheck from 'lucide-svelte/icons/badge-check'
import Calendar from 'lucide-svelte/icons/calendar'
import FileQuestion from 'lucide-svelte/icons/file-question'
import FileText from 'lucide-svelte/icons/file-text'
import Handshake from 'lucide-svelte/icons/handshake'
import HelpCircle from 'lucide-svelte/icons/help-circle'
import Home from 'lucide-svelte/icons/home'
import Mail from 'lucide-svelte/icons/mail'
import Pin from 'lucide-svelte/icons/map-pinned'
import Menu from 'lucide-svelte/icons/menu'
import NotePadText from 'lucide-svelte/icons/notepad-text'
import Paintbrush from 'lucide-svelte/icons/paintbrush'
import Settings from 'lucide-svelte/icons/settings'
import TextCursor from 'lucide-svelte/icons/text-cursor-input'
import Users from 'lucide-svelte/icons/users'
import { setContext } from 'svelte'
import { writable } from 'svelte/store'

export let data
$: currPath = $page.url.pathname.replace('/manage', '')
let links = [
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
		path: '/appearance',
		label: 'Appearance',
		icon: Paintbrush,
	},
	// {
	// 	path: '/notifications',
	// 	label: 'Notifications',
	// },
]
setContext('venues', writable(data.venues))
</script>

<div class="grid h-full grid-rows-[4.1rem_1fr]">
	<div class="bg-whitefont-semibold grid grid-cols-[15rem_1fr] items-center">
		<div
			class="flex h-full w-full flex-1 items-center border-r-2 border-stone-100 bg-stone-50 px-4 text-center"
		>
			<div class="w-full rounded-xl bg-stone-200/40 py-3 font-semibold text-stone-600">
				{data.event.name}
			</div>
		</div>
		<div class="border-b border-stone-100 px-1.5 py-1.5">
			<input
				type="text"
				placeholder="Search anything..."
				class="font-xl w-8/12 rounded-xl border border-stone-100 bg-white px-5 py-3 font-medium"
			/>
		</div>
	</div>
	<div class="grid h-full grid-cols-[15em_1fr]">
		<div
			class="flex h-full flex-col gap-0.5 border-r-2 border-stone-100 bg-stone-50 px-2 py-3 text-sm font-medium text-stone-600"
		>
			{#each links as link}
				{#if link.section}
					<div
						class="mt-3 border-t border-stone-200/70 px-2 pt-3 text-[0.7rem] font-semibold uppercase text-stone-600"
					>
						{link.label}
					</div>
				{:else}
					{@const thisBits = link.path.substr(1).split('/')}
					{@const currBits = currPath.substr(1).split('/')}
					<a
						class="flex items-center gap-2 rounded-md px-2 py-2 text-[0.85rem] {thisBits[0] === currBits[0] ? 'bg-stone-200/50 text-stone-600' : 'text-stone-500/80 hover:bg-stone-100'}"
						href="/manage{link.path}"
					>
						{#if link.icon}
							<svelte:component this={link.icon} class="h-4 w-4 {link.iconClass || ''}" />
						{/if}
						<span>{link.label}</span>
					</a>
				{/if}
			{/each}
		</div>
		<div class="bg-white"><slot /></div>
	</div>
</div>
