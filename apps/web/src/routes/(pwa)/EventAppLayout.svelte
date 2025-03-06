<script lang="ts">
	import { page } from '$app/stores'
	import { getEventContext } from '$lib/state/getContexts'
	import { getRawRgb } from '$lib/util/getRawRgb'

	import TabBar from './TabBar.svelte'

	const event = getEventContext()
	$: cssVars = $event?.colors
		? Object.entries($event?.colors)
				.map(([key, value]) => {
					return `--a-${key}: ${getRawRgb(value)};`
				})
				.join(' ')
		: ''
	$: showSidebar =
		!$page.url.pathname.includes('/login') && !$page.url.pathname.includes('/welcome')
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
			<div id="tabbar">
				<TabBar />
			</div>
		</div>
	{:else}
		<div></div>
	{/if}
</div>

<style>
	:global(body) {
		overflow-x: hidden;
	}
</style>
