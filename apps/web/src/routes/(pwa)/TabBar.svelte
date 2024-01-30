<script lang="ts">
import { page } from '$app/stores'
import Button from '$lib/components/ui/button/button.svelte'
import BadgeCheck from 'lucide-svelte/icons/badge-check'
import Calendar from 'lucide-svelte/icons/calendar'
import HelpCircle from 'lucide-svelte/icons/help-circle'
import Home from 'lucide-svelte/icons/home'
import Mail from 'lucide-svelte/icons/mail'
import Map from 'lucide-svelte/icons/map'
import Pin from 'lucide-svelte/icons/map-pinned'
import Menu from 'lucide-svelte/icons/menu'
import Rocket from 'lucide-svelte/icons/rocket'
import Send from 'lucide-svelte/icons/send'
import Users from 'lucide-svelte/icons/users'
import Utensils from 'lucide-svelte/icons/utensils'

import { tw } from '@matterloop/ui'

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
		label: 'Panelists & Moderators',
		icon: Users,
		href: '/speakers',
		classes: 'hidden lg:flex',
	},
	{
		label: 'Sponsors',
		icon: BadgeCheck,
		href: '/sponsors',
		classes: 'hidden lg:flex',
	},
	{
		label: 'Menu',
		icon: Menu,
		href: '/menu',
		classes: 'flex lg:hidden',
	},
]
const bottomTabs = [
	{
		label: 'Venue Map',
		icon: Map,
		href: '/map',
		classes: 'hidden lg:flex',
	},
	{
		label: 'Meal Options',
		icon: Utensils,
		href: '/meals',
		classes: 'hidden lg:flex',
	},
	{
		label: 'FAQs',
		icon: HelpCircle,
		href: '/faq',
		classes: 'hidden lg:flex',
	},
	{
		label: 'Contact',
		icon: Mail,
		href: '/contact',
		classes: 'hidden lg:flex',
	},
]

$: bits = $page.url.pathname.split('/')
</script>

<div
	class="tabbar relative flex items-center border-t border-slate-200 bg-slate-50 lg:flex-col lg:border-0 lg:bg-slate-800"
>
	<div
		class="mx-auto flex w-full items-center justify-around md:max-w-2xl lg:fixed lg:top-4 lg:w-[14rem] lg:flex-col"
	>
		{#each tabs as { label, icon, href, classes }, i}
			{@const currBits = href.split('/')}
			<Button
				href={href}
				variant="ghost"
				class={tw(`flex h-full w-20 flex-none flex-col items-center gap-0.5 py-1 text-[0.7rem] transition-none hover:bg-transparent focus:bg-transparent lg:w-full lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:rounded-lg lg:bg-slate-800 lg:px-2.5 lg:py-2 lg:text-sm lg:text-white  lg:hover:text-white ${bits[1] === currBits[1]? 'text-main hover:text-main lg:bg-slate-900 lg:hover:bg-slate-900' : 'text-slate-600 hover:lg:bg-slate-700'} ${classes}`)}
			>
				<svelte:component
					this={icon}
					class="w-[1.5rem] lg:w-[1.2rem]  {bits[1] === currBits[1]? 'text-main w-[1.5rem] lg:text-white' : 'text-slate-600  lg:text-white/50'}"
				/>
				<div>{label}</div>
			</Button>
		{/each}
	</div>
	<div
		class="fixed bottom-4 mx-auto hidden w-[14rem] items-center justify-around md:max-w-2xl lg:flex lg:flex-col"
	>
		{#each bottomTabs as { label, icon, href, classes }, i}
			{@const currBits = href.split('/')}
			<Button
				href={href}
				variant="ghost"
				class={tw(`flex h-full w-20 flex-none flex-col items-center gap-0.5 py-1 text-[0.7rem] transition-none hover:bg-transparent focus:bg-transparent lg:w-full lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:rounded-lg lg:bg-slate-800 lg:px-2.5 lg:py-2 lg:text-sm lg:text-white  lg:hover:text-white ${bits[1] === currBits[1]? 'text-main hover:text-main lg:bg-slate-900 lg:hover:bg-slate-900' : 'text-slate-600 hover:lg:bg-slate-700'} ${classes}`)}
			>
				<svelte:component
					this={icon}
					class="w-[1.5rem] lg:w-[1.2rem]  {bits[1] === currBits[1]? 'text-main w-[1.5rem] lg:text-white' : 'text-slate-600  lg:text-white/50'}"
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
