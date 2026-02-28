<script lang="ts">
	import SelectVenue from '$lib/components/SelectVenue.svelte'
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import VenueMapUploader from '$lib/components/VenueMapUploader.svelte'
	import { trpc } from '$lib/trpc/client'
	import Plus from 'lucide-svelte/icons/plus'
	import { dndzone } from 'svelte-dnd-action'
	import { flip } from 'svelte/animate'

	import { getId, orderBy, startCase } from '@matterloop/util'

	import AdminScreen from '../../AdminScreen.svelte'

	export let data
	const vals = {
		building: 1,
		room: 2,
	}
	let maps = data.media

	function handleChangedElements() {
		const orderChanges: { id: string; ord: number }[] = []
		maps.map((elm, i) => {
			if (elm.ord !== i) {
				orderChanges.push({ id: elm.id, ord: i })
				maps[i].ord = i
			}
		})
		if (orderChanges.length) {
			trpc().venue.order.mutate({ changes: orderChanges })
		}
	}
	const flipDurationMs = 300
	function handleDndConsider(e) {
		maps = e.detail.items
	}
	function handleDndFinalize(e) {
		maps = e.detail.items
		handleChangedElements()
	}
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-3" slot="title">
		<div class="text-2xl font-semibold">Venue Maps</div>
	</div>
	<div class="max-w-xl">
		<div
			class="flex h-full flex-col gap-4 px-2 pb-2 pt-2"
			use:dndzone={{
				items: maps,
				flipDurationMs,
				dropTargetStyle: {},
				dropTargetClasses: ['outline-blue-200', 'outline-dashed', 'outline-2'],
			}}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
		>
			{#each maps || [] as element, i (element.id)}
				<VenueMapUploader media={element} venues={data.venues} />
			{/each}
		</div>
		<Button
			variant="secondary"
			class="mt-10 w-full bg-stone-100"
			on:click={() => {
				maps.push({ id: getId(), parentId: data.venues[0].id, ord: maps.length })
				maps = maps
			}}>Add Venue Map</Button
		>
	</div>
</AdminScreen>
