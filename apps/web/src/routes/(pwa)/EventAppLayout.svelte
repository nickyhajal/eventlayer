<script lang="ts">
import { page } from '$app/stores'

import TabBar from './TabBar.svelte'
</script>

<div class="bg-slate-800 lg:grid lg:h-full lg:grid-cols-[15rem_1fr] lg:bg-white">
	<div class="lg:order-1">
		<slot />
	</div>
	{#if ['/login', '/welcome'].includes(!$page.url.pathname)}
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
