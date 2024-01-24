<script lang="ts">
import TabBar from './TabBar.svelte'
</script>

<div class="bg-slate-800 lg:bg-white">
	<div class="">
		<slot />
	</div>
	<div class="tabbar fixed bottom-0 z-50 w-full bg-green-500">
		<TabBar />
	</div>
</div>

<style>
</style>
