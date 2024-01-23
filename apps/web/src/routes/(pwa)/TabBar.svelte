<script lang="ts">
import { page } from '$app/stores'
import Button from '$lib/components/ui/button/button.svelte'
import Calendar from 'lucide-svelte/icons/calendar'
import Home from 'lucide-svelte/icons/home'
import Pin from 'lucide-svelte/icons/map-pinned'
import Menu from 'lucide-svelte/icons/menu'
import Send from 'lucide-svelte/icons/send'

const tabs = [
	{
		label: 'Home',
		icon: Home,
		href: '/',
	},
	{
		label: 'Schedule',
		icon: Calendar,
		href: '/schedule',
	},
	{
		label: 'Venues',
		icon: Pin,
		href: '/venues',
	},
	// {
	// 	label: 'Info',
	// 	icon: Send,
	// 	href: '/info',
	// },
	{
		label: 'Menu',
		icon: Menu,
		href: '/menu',
	},
]

$: bits = $page.url.pathname.split('/')
</script>

<div class="order-1 flex items-center border-t border-slate-200 bg-slate-50 lg:order-first">
	<div class="mx-auto flex w-full items-center justify-around md:max-w-2xl">
		{#each tabs as { label, icon, href }, i}
			{@const currBits = href.split('/')}
			<Button
				href={href}
				variant="ghost"
				class="flex h-full w-20 flex-none flex-col items-center gap-0.5 py-1 text-[0.7rem] {bits[1] === currBits[1]? 'text-cyan-700 hover:text-cyan-700' : 'text-slate-600'}"
			>
				<svelte:component
					this={icon}
					class="w-[1.5rem]  {bits[1] === currBits[1]? 'text-cyan-600' : 'text-slate-600'}"
				/>
				<div>{label}</div>
			</Button>
		{/each}
	</div>
</div>
