<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import BiggerPicture from 'bigger-picture/svelte'

import '$lib/bigger-picture.css'

import { onMount } from 'svelte'

let bp
onMount(() => {
	if (typeof window !== 'undefined') {
		bp = BiggerPicture({
			target: document.body,
		})
	}
})
function open() {
	bp.open({
		items: document.querySelectorAll('#bp > div'),
		scale: 1,
		intro: 'fadeup',
		maxZoom: 3,
	})
}
</script>

<Screen title="Venue Map" back="/menu">
	<div id="bp" class="inline-gallery container mx-auto h-full pt-12 md:max-w-7xl">
		<div
			on:click={() => open()}
			data-img="/map.jpg"
			data-alt="image description"
			data-height="2000"
			data-width="1545"
		>
			<img src="/map.jpg" alt="venue map" />
		</div>
	</div>
</Screen>

<style>
</style>
