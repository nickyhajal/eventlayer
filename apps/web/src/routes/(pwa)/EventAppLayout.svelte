<script lang="ts">
	import { page } from '$app/stores'
	import ChicletButton from '$lib/components/ui/ChicletButton.svelte'
	import { getEventContext } from '$lib/state/getContexts'
	import ShareIcon from '$lib/svg/ShareIcon.svelte'
	import { getRawRgb } from '$lib/util/getRawRgb'
	import Download from 'lucide-svelte/icons/download'
	import EllipsisVertical from 'lucide-svelte/icons/more-vertical'
	import X from 'lucide-svelte/icons/x'

	import { Modal } from '@matterloop/ui'
	import { isIos } from '@matterloop/util'

	import TabBar from './TabBar.svelte'

	const event = getEventContext()
	let installModalOpen = false
	let suggestedInstall =
		typeof window !== 'undefined' && window.localStorage.getItem('pwa-install-blocked') !== 'true'
	$: cssVars = $event?.colors
		? Object.entries($event?.colors)
				.map(([key, value]) => {
					return `--a-${key}: ${getRawRgb(value)};`
				})
				.join(' ')
		: ''
	$: showSidebar =
		!$page.url.pathname.includes('/login') && !$page.url.pathname.includes('/welcome')

	function denyInstall() {
		window.localStorage.setItem('pwa-install-blocked', 'true')
		suggestedInstall = false
	}
</script>

<div
	class="grid min-h-full w-screen overflow-x-hidden {showSidebar
		? 'lg:grid-cols-[15rem_1fr] bg-slate-800'
		: 'lg:grid-cols-[1fr]'} lg:bg-white"
	style={cssVars}
>
	<div class={showSidebar ? 'lg:order-1' : ''}>
		<slot />
	</div>
	{#if showSidebar}
		<div
			class="tabbar lg:order-0 fixed bottom-0 z-50 w-full bg-slate-800 lg:relative lg:px-2 lg:py-3"
		>
			{#if suggestedInstall}
				<div class="bg-white lg:hidden w-full flex items-center border-t-4 border-yellow-900/5">
					<div
						class="bg-yellow-50/60 justify-between text-sm pl-6 pr-2 pt-1.5 pb-1.5 font-semibold tracking-[0.3px] text-slate-900/70 w-full flex items-center border-t border-yellow-800/10"
					>
						<div>Install on Your Home Screen</div>
						<div class="flex gap-8 items-center">
							<ChicletButton
								class="flex gap-1.5 pl-[9px]"
								on:click={() => (installModalOpen = true)}
							>
								<Download class="w-4 -mt-[1px] text-orange-800/40" />
								<span class="text-orange-700">Install</span>
							</ChicletButton>
							<button class="p-2 relative z-10" on:click={() => denyInstall()}>
								<X class="w-4 text-slate-900/70" />
							</button>
						</div>
					</div>
				</div>
			{/if}
			<div id="tabbar">
				<TabBar />
			</div>
		</div>
	{:else}
		<div></div>
	{/if}
</div>
<Modal open={true} on:close={() => (installModalOpen = false)}>
	<div class="p-8 h-full">
		<h2 class="text-xl font-bold pb-3">Install on Your Home Screen</h2>
		<p class="text-sm text-slate-500">
			Install the app on your home screen for a better experience.
		</p>
		<div class="pt-4">
			First, tap this icon
			{#if isIos()}
				<ShareIcon class="w-6 inline-block -mt-[6px] text-blue-700" /> below. Then, select
			{:else}
				<EllipsisVertical class="w-6 inline-block -mt-[6px] text-blue-700" /> in your browser above.
				Then, select
			{/if}
			Add to Home Screen.
		</div>
		<div class="flex gap-2 pt-10 justify-end">
			<button
				class="text-sm text-blue-600 font-semibold cursor-pointer"
				on:click={() => (installModalOpen = false)}>Cancel</button
			>
		</div>
	</div>
</Modal>

<style>
	:global(body) {
		overflow-x: hidden;
	}
</style>
