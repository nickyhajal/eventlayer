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

<Screen title="Sponsor Map" back="/menu">
	<div id="bp" class="inline-gallery container mx-auto h-full pt-12 md:max-w-7xl">
		<div
			on:click={() => open()}
			data-img="/sponsor-map.jpg"
			data-alt="image description"
			data-height="1116"
			data-width="1500"
		>
			<img src="/sponsor-map.jpg" alt="sponsor map" />
		</div>
	</div>
</Screen>

<style>
</style>
