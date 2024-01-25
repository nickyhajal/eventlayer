<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

const me = getMeContext()
</script>

<Screen title="Venue Map" back="/menu">
	<div class="container mx-auto pt-0 md:max-w-7xl">
		<enhanced:img
			src="../../../../static/map.jpg"
			alt="An alt text"
			class="mx-auto my-0 w-full md:w-8/12"
		/>
	</div>
</Screen>
