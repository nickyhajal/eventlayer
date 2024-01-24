<script lang="ts">
import { page } from '$app/stores'
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getMeContext } from '$lib/state/getContexts'

const me = getMeContext()
const tabs = [
	{
		label: 'Panelists & Moderators',
		// icon: Home,
		classes: 'col-span-2',
		href: '/speakers',
	},
	{
		label: 'Sponsors',
		// icon: Home,
		classes: 'col-span-2',
		href: '/sponsors',
	},
	{
		label: 'FAQs',
		// icon: Home,
		href: '/faq',
	},
	{
		label: 'Contact',
		// icon: Home,
		href: '/contact',
	},
]

$: bits = $page.url.pathname.split('/')
</script>

<Screen title="Menu">
	<div class="container mx-auto max-w-7xl">
		<div class="flex flex-col justify-end gap-2">
			<div class="menu fixed grid w-full grid-cols-2 gap-2">
				{#each tabs as { label, icon, href, classes }, i}
					{@const currBits = href.split('/')}
					<Button
						href={href}
						variant="secondary"
						class="flex w-full flex-none flex-col items-center gap-0.5 py-8 text-base {bits[1] === currBits[1]?'' : ''} {classes ||''}"
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
