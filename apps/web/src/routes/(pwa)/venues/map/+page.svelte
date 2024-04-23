<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import BiggerPicture from 'bigger-picture/svelte'
import ChevronRight from 'lucide-svelte/icons/chevron-right'

import '$lib/bigger-picture.css'

import { onMount } from 'svelte'

export let data
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
let maps = data.media
$: title = `Venue ${maps.length > 1 ? 'Maps' : 'Map'}`
</script>

<Screen title={title} back="/menu" bigTitle={title}>
	<div class="pt-safe-offset-4"></div>
	{#if maps.length > 1}
		<div class="flex flex-col gap-2">
			{#each maps as map}
				<a
					href="/venues/map/{map.id}"
					class="bg-a-accent/5 border-a-accent/10 flex items-center justify-between rounded-lg border border-b-2 p-4 font-semibold text-stone-700/80"
				>
					<div>{map.title}</div>
					<ChevronRight class="h-5 w-5 flex-none self-center text-stone-700/50" />
				</a>
			{/each}
		</div>
	{:else}
		<div id="bp" class="inline-gallery container mx-auto h-full pt-12 md:max-w-7xl">
			<div
				on:click={() => open()}
				data-img="/map.jpg"
				data-alt="image description"
				data-height="720"
				data-width="568"
			>
				<img src="/map.jpg" alt="venue map" />
			</div>
		</div>
	{/if}
</Screen>

<style>
</style>
