<script lang="ts">
	import Screen from '$lib/components/Screen.svelte'
	import BiggerPicture from 'bigger-picture/svelte'

	import '$lib/bigger-picture.css'

	import { date } from 'drizzle-orm/mysql-core'
	import { onMount } from 'svelte'

	import { getMediaUrl } from '@matterloop/util'

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
	$: url = getMediaUrl(data.media)
	$: title = data.media.title
</script>

<Screen {title} back="/venue/map" bigTitle={title}>
	<div id="bp" class="inline-gallery container mx-auto h-full pt-12 md:max-w-7xl">
		<div
			on:click={() => open()}
			data-img={url}
			data-alt={data.media.title}
			data-height={data.media.height}
			data-width={data.media.width}
		>
			<img src={url} alt="venue map" />
		</div>
	</div>
</Screen>

<style>
</style>
