<script lang="ts">
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
	{
		label: 'Info',
		icon: Send,
		href: '/info',
	},
	{
		label: 'Menu',
		icon: Menu,
		href: '/menu',
	},
]
</script>

<div class="order-1 flex items-center border-t-2 border-slate-300 bg-slate-200 lg:order-first">
	<div class="mx-auto flex w-full items-center justify-around md:max-w-2xl">
		{#each tabs as { label, icon, href }, i}
			<Button
				href={href}
				variant="ghost"
				class="flex h-full flex-col items-center gap-0.5 py-1 text-[0.7rem] text-slate-600"
			>
				<svelte:component this={icon} class="w-[1.5rem] text-slate-700" />
				<div>{label}</div>
			</Button>
		{/each}
	</div>
</div>
