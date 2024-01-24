<script lang="ts">
import TabBar from './TabBar.svelte'
</script>

<div class="bg-slate-800">
	<div class="bg-red-500">
		<slot />
	</div>
	<div class="tabbar fixed bottom-0 z-50 w-full">
		<TabBar />
	</div>
</div>

<style>
</style>
