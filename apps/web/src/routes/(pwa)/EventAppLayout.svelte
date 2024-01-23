<script lang="ts">
import TabBar from './TabBar.svelte'
</script>

<div class="">
	<div>
		<slot />
	</div>
	<div class="tabbar fixed w-full">
		<TabBar />
	</div>
</div>

<style>
.tabbar {
	bottom: env(safe-area-inset-bottom);
}
</style>
