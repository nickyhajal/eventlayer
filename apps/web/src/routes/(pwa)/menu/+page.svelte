<script lang="ts">
import { page } from '$app/stores'
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getMeContext } from '$lib/state/getContexts'
import BadgeCheck from 'lucide-svelte/icons/badge-check'
import HelpCircle from 'lucide-svelte/icons/help-circle'
import Mail from 'lucide-svelte/icons/mail'
import Map from 'lucide-svelte/icons/map'
import Users from 'lucide-svelte/icons/users'
import Utensils from 'lucide-svelte/icons/utensils'

const tabs = [
	{
		label: 'Panelists & Moderators',
		icon: Users,
		classes: 'col-span-2',
		href: '/speakers',
	},
	{
		label: 'Sponsors',
		icon: BadgeCheck,
		classes: 'col-span-2',
		href: '/sponsors',
	},
	{
		label: 'Venue Map',
		icon: Map,
		classes: '',
		href: '/map',
	},
	{
		label: 'Meal Options',
		icon: Utensils,
		classes: '',
		href: '/meals',
	},
	{
		label: 'FAQs',
		icon: HelpCircle,
		href: '/faq',
	},
	{
		label: 'Contact',
		icon: Mail,
		href: '/contact',
	},
]

$: bits = $page.url.pathname.split('/')
</script>

<!-- class="flex w-full flex-none flex-col items-start justify-center gap-0.5 border border-b-2 border-slate-200/50 border-b-slate-300/50 bg-slate-100/70 py-9 text-left text-sm font-semibold text-slate-600 {bits[1] === currBits[1]?'' : ''} {classes ||''}" -->
<Screen title="Menu">
	<div class="container mx-auto max-w-7xl">
		<div class="flex flex-col justify-end gap-2">
			<div class="menu fixed grid w-[calc(100dvw-1.5rem)] grid-cols-2 gap-2 lg:relative lg:w-full">
				{#each tabs as { label, icon, href, classes }, i}
					{@const currBits = href.split('/')}
					<Button
						href={href}
						variant="secondary"
						class="bg-main border-main hover:bg-main border-b-main/10 flex w-full flex-none flex-col items-start justify-center gap-0.5 border border-b-2 border-opacity-[0.06] bg-opacity-[0.04] py-9 text-left text-sm font-semibold text-red-700 hover:bg-opacity-[0.07] {bits[1] === currBits[1]?'' : ''} {classes ||''} "
					>
						{#if icon}
							<div class="border-main/20 mb-0.5 rounded-full border bg-white/40 p-1.5 opacity-80">
								<svelte:component this={icon} class="text-main/70  h-[1rem] w-[1rem] flex-none" />
							</div>
						{/if}
						<div>{label}</div>
					</Button>
				{/each}
			</div>
		</div>
	</div>
</Screen>

<style>
.menu {
	bottom: calc(4rem + env(safe-area-inset-bottom));
}
.container > .flex {
	height: calc(100vh - 8rem - env(safe-area-inset-bottom));
}
</style>
