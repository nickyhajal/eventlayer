<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { page } from '$app/stores'
	import ChicletButton from '$lib/components/ui/ChicletButton.svelte'
	import { getEventContext } from '$lib/state/getContexts'
	import ShareIcon from '$lib/svg/ShareIcon.svelte'
	import { getRawRgb } from '$lib/util/getRawRgb'
	import Download from 'lucide-svelte/icons/download'
	import EllipsisVertical from 'lucide-svelte/icons/more-vertical'
	import X from 'lucide-svelte/icons/x'

	import { Modal } from '@matterloop/ui'
	import { dayjs, isIos } from '@matterloop/util'

	import TabBar from './TabBar.svelte'

	const event = getEventContext()
	let installModalOpen = false
	let isPwa =
		typeof window !== 'undefined' ? window.matchMedia('(display-mode: standalone)').matches : false
	let suggestedInstall =
		typeof window !== 'undefined' &&
		window.localStorage.getItem('pwa-install-blocked') !== 'true' &&
		!window.matchMedia('(display-mode: standalone)').matches
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

	let lastRefresh = dayjs()
	if (typeof document !== 'undefined') {
		document.addEventListener('visibilitychange', () => {
			const state = document.visibilityState
			if (state === 'hidden') {
				// your PWA is now in the background
			}

			if (state === 'visible') {
				if (dayjs().diff(lastRefresh, 'm') > 1) {
					invalidateAll()
					lastRefresh = dayjs()
				}
			}
		})
	}
</script>

<div
	class="grid min-h-full w-screen overflow-x-hidden {showSidebar
		? 'bg-slate-800 lg:grid-cols-[15rem_1fr]'
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
				<div class="flex w-full items-center border-t-4 border-yellow-900/5 bg-white lg:hidden">
					<div
						class="flex w-full items-center justify-between border-t border-yellow-800/10 bg-yellow-50/60 pb-1.5 pl-6 pr-2 pt-1.5 text-sm font-semibold tracking-[0.3px] text-slate-900/70"
					>
						<div>Install on Your Home Screen</div>
						<div class="flex items-center gap-8">
							<ChicletButton
								class="flex gap-1.5 pl-[9px]"
								on:click={() => (installModalOpen = true)}
							>
								<Download class="-mt-[1px] w-4 text-orange-800/40" />
								<span class="text-orange-700">Install</span>
							</ChicletButton>
							<button class="relative z-10 p-2" on:click={() => denyInstall()}>
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
<Modal bind:open={installModalOpen} on:close={() => (installModalOpen = false)}>
	<div class="h-full p-8">
		<h2 class="pb-3 text-xl font-bold">Install on Your Home Screen</h2>
		<p class="text-sm text-slate-500">
			Install the app on your home screen for a better experience.
		</p>
		<div class="pt-4">
			First, tap this icon
			{#if isIos()}
				<ShareIcon class="-mt-[6px] inline-block w-6 text-blue-700" /> below. Then, select
			{:else}
				<EllipsisVertical class="-mt-[6px] inline-block w-6 text-blue-700" /> in your browser above.
				Then, select
			{/if}
			Add to Home Screen.
		</div>
		<div class="flex justify-end gap-2 pt-10">
			<button
				type="button"
				class="relative z-30 cursor-pointer text-sm font-semibold text-blue-600"
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
