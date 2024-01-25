<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'
import BiggerPicture from 'bigger-picture/svelte'

import '$lib/bigger-picture.css'

import { onMount } from 'svelte'

let bp
onMount(() => {
	bp = BiggerPicture({
		target: document.body,
	})
})

// open (will be a child of the target element above)
function open() {
	console.log('open')
	bp.open({
		items: document.querySelectorAll('.container > div'),
	})
}
</script>

<Screen title="Venue Map" back="/menu">
	<div class="container mx-auto pt-0 md:max-w-7xl">
		<div on:click={() => open()} data-height="2000" data-width="3000">
			<enhanced:img
				src="../../../../static/map.jpg"
				alt="An alt text"
				class="mx-auto my-0 w-full md:w-8/12"
			/>
		</div>
	</div>
</Screen>
