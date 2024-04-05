<script lang="ts">
import { page } from '$app/stores'
import Button from '$lib/components/ui/button/button.svelte'
import { getEventContext } from '$lib/state/getContexts'
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

const event = getEventContext()

const topTabs = $event.menus.filter((m) => m.location === 'top-sidebar')
const bottomTabs = $event.menus.filter((m) => m.location === 'bot-sidebar')
const mobileTabs = $event.menus.filter((m) => m.location === 'tabs')

// const bottomTabs = [
// 	{
// 		label: 'Venue Map',
// 		icon: Map,
// 		href: '/map',
// 		classes: 'hidden lg:flex',
// 	},
// 	{
// 		label: 'Meal Options',
// 		icon: Utensils,
// 		href: '/meals',
// 		classes: 'hidden lg:flex',
// 	},
// 	{
// 		label: 'FAQs',
// 		icon: HelpCircle,
// 		href: '/faq',
// 		classes: 'hidden lg:flex',
// 	},
// 	{
// 		label: 'Contact',
// 		icon: Mail,
// 		href: '/contact',
// 		classes: 'hidden lg:flex',
// 	},
// ]

$: bits = $page.url.pathname.split('/')
</script>

{#if !['/login', '/welcome'].includes($page.url.pathname)}
	<div
		class="tabbar relative flex items-center border-t border-slate-200 bg-slate-50 lg:flex-col lg:border-0 lg:bg-slate-800"
	>
		<div
			class="mx-auto hidden w-full items-center justify-around gap-1 md:max-w-2xl lg:fixed lg:top-4 lg:flex lg:w-[14rem] lg:flex-col"
		>
			{#each topTabs as { label, icon, link, classes }, i}
				{@const currBits = link.split('/')}
				<Button
					href={link}
					variant="ghost"
					class={tw(`flex h-full w-20 flex-none flex-col items-center gap-0.5 py-1 text-[0.7rem] transition-none hover:bg-transparent focus:bg-transparent lg:w-full lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:rounded-lg lg:bg-slate-800 lg:px-2.5 lg:py-2 lg:text-sm lg:text-white  lg:hover:text-white ${bits[1] === currBits[1]? 'text-a-accent hover:text-a-accent brightness-90 lg:bg-slate-900 lg:hover:bg-slate-900' : 'text-slate-600 hover:lg:bg-slate-700'} ${classes}`)}
				>
					<div class="icon {bits[1] === currBits[1]? 'selected' : ''}">{@html icon}</div>
					<!-- <svelte:component
						this={icon}
						class="w-[1.5rem] lg:w-[1.2rem]  {bits[1] === currBits[1]? 'text-a-accent w-[1.5rem] lg:text-white' : 'text-slate-600  lg:text-white/50'}"
					/> -->
					<div>{label}</div>
				</Button>
			{/each}
		</div>
		<div class="mx-auto flex w-full items-center justify-around gap-1 md:max-w-2xl lg:hidden">
			{#each mobileTabs as { label, icon, link, classes }, i}
				{@const currBits = link.split('/')}
				<Button
					href={link}
					variant="ghost"
					class={tw(`flex h-full w-20 flex-none flex-col items-center gap-0.5 py-1 text-[0.7rem] transition-none hover:bg-transparent focus:bg-transparent lg:w-full lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:rounded-lg lg:bg-slate-800 lg:px-2.5 lg:py-2 lg:text-sm lg:text-white  lg:hover:text-white ${bits[1] === currBits[1]? 'text-a-accent hover:text-a-accent brightness-90 lg:bg-slate-900 lg:hover:bg-slate-900' : 'text-slate-600 hover:lg:bg-slate-700'} ${classes}`)}
				>
					<div class="icon {bits[1] === currBits[1]? 'selected' : ''}">{@html icon}</div>
					<!-- <svelte:component
						this={icon}
						class="w-[1.5rem] lg:w-[1.2rem]  {bits[1] === currBits[1]? 'text-a-accent w-[1.5rem] lg:text-white' : 'text-slate-600  lg:text-white/50'}"
					/> -->
					<div>{label}</div>
				</Button>
			{/each}
		</div>
		<div
			class="fixed bottom-4 mx-auto hidden w-[14rem] items-center justify-around gap-1 md:max-w-2xl lg:flex lg:flex-col"
		>
			{#each bottomTabs as { label, icon, link, classes }, i}
				{@const currBits = link.split('/')}
				<Button
					href={link}
					variant="ghost"
					class={tw(`hidden h-full w-20 flex-none flex-col items-center gap-0.5 py-1 text-[0.7rem] transition-none hover:bg-transparent focus:bg-transparent lg:flex lg:w-full lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:rounded-lg lg:bg-slate-800 lg:px-2.5 lg:py-2 lg:text-sm lg:text-white  lg:hover:text-white ${bits[1] === currBits[1]? 'text-a-accent hover:text-a-accent lg:bg-slate-900 lg:hover:bg-slate-900' : 'text-slate-600 hover:lg:bg-slate-700'} ${classes}`)}
				>
					<div class="icon {bits[1] === currBits[1]? 'selected' : ''}">{@html icon}</div>
					<div>{label}</div>
				</Button>
			{/each}
		</div>
	</div>
{/if}

<style lang="postcss">
.tabbar {
	padding-bottom: env(safe-area-inset-bottom);
}
.icon :global(svg) {
	@apply w-[1.5rem] text-slate-600  lg:w-[1.2rem]  lg:text-white/50;
}
.icon.selected :global(svg) {
	@apply text-a-accent lg:text-white;
}
</style>
