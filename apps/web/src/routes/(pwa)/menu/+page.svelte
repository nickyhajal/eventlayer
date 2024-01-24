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
		href: '/speakers',
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
	{
		label: 'Test',
		// icon: Home,
		href: '/test',
	},
]

$: bits = $page.url.pathname.split('/')
</script>

<Screen title="Menu">
	<div class="container mx-auto max-w-7xl">
		<div class="flex h-[calc(100dvh-9rem)] flex-col justify-end gap-2">
			{#each tabs as { label, icon, href }, i}
				{@const currBits = href.split('/')}
				<Button
					href={href}
					variant="secondary"
					class="flex w-full flex-none flex-col items-center gap-0.5 py-8 text-base {bits[1] === currBits[1]?'' : ''}"
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
</Screen>

<style>
.container {
	padding-bottom: env(safe-area-inset-bottom);
}
</style>
