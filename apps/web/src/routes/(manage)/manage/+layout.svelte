<script lang="ts">
	import { page } from '$app/stores'
	import Calendar from 'lucide-svelte/icons/calendar'
	import FileQuestion from 'lucide-svelte/icons/file-question'
	import FileText from 'lucide-svelte/icons/file-text'
	import Handshake from 'lucide-svelte/icons/handshake'
	import HelpCircle from 'lucide-svelte/icons/help-circle'
	import Home from 'lucide-svelte/icons/home'
	import KeyRound from 'lucide-svelte/icons/key-round'
	import Mail from 'lucide-svelte/icons/mail'
	import Pin from 'lucide-svelte/icons/map-pinned'
	import SquareMenu from 'lucide-svelte/icons/menu-square'
	import NotePadText from 'lucide-svelte/icons/notepad-text'
	import Paintbrush from 'lucide-svelte/icons/paintbrush'
	import Settings from 'lucide-svelte/icons/settings'
	import TextCursor from 'lucide-svelte/icons/text-cursor-input'
	import Ticket from 'lucide-svelte/icons/ticket'
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
			<a
				href="/"
				target="_blank"
				class="w-full rounded-xl bg-stone-200/40 py-3 font-semibold text-stone-600 transition-all hover:bg-stone-200/60"
			>
				{data.event.name}
			</a>
		</div>
		<div class="border-b border-stone-100 px-1.5 py-1.5">
			<input
				type="text"
				placeholder="Search anything..."
				class="font-xl w-8/12 rounded-md bg-white px-4 py-3 font-medium !outline-0 !ring-0 transition-all focus-within:outline-none focus-within:ring-0 hover:bg-stone-50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none active:ring-0"
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
						class="flex items-center gap-2 rounded-md px-2 py-2 text-[0.85rem] {thisBits[0] ===
						currBits[0]
							? 'bg-stone-200/50 text-stone-600'
							: 'text-stone-500/80 hover:bg-stone-100'}"
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
