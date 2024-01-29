<script lang="ts">
import { page } from '$app/stores'
import Button from '$lib/components/ui/button/button.svelte'
import Calendar from 'lucide-svelte/icons/calendar'
import Home from 'lucide-svelte/icons/home'
import Pin from 'lucide-svelte/icons/map-pinned'
import Menu from 'lucide-svelte/icons/menu'
import Rocket from 'lucide-svelte/icons/rocket'
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
		label: 'Program',
		icon: Rocket,
		href: '/program',
	},
	{
		label: 'Menu',
		icon: Menu,
		href: '/menu',
	},
]

$: bits = $page.url.pathname.split('/')
</script>

<div class="tabbar relative flex items-center border-t border-slate-200 bg-slate-50">
	<div class="mx-auto flex w-full items-center justify-around md:max-w-2xl">
		{#each tabs as { label, icon, href }, i}
			{@const currBits = href.split('/')}
			<Button
				href={href}
				variant="ghost"
				class="flex h-full w-20 flex-none flex-col items-center gap-0.5 py-1 text-[0.7rem] transition-none {bits[1] === currBits[1]? 'text-main hover:text-main' : 'text-slate-600'}"
			>
				<svelte:component
					this={icon}
					class="w-[1.5rem]  {bits[1] === currBits[1]? 'text-main' : 'text-slate-600'}"
				/>
				<div>{label}</div>
			</Button>
		{/each}
	</div>
</div>

<style>
.tabbar {
	padding-bottom: env(safe-area-inset-bottom);
}
</style>
