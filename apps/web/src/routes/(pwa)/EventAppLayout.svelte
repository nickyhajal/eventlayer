<script lang="ts">
import TabBar from './TabBar.svelte'
</script>

<div class="grid h-full grid-rows-[1fr_3.6rem] lg:grid-rows-[3.6rem_1fr]">
	<TabBar />
	<div>
		<slot />
	</div>
</div>
