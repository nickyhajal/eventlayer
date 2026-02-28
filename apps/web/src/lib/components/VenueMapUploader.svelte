<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import Input from '$lib/components/ui/input/input.svelte'
	import Label from '$lib/components/ui/label/label.svelte'
	import { trpc } from '$lib/trpc/client'
	import { trpcCaller } from '$lib/util/trpcCaller'
	import { toast } from 'svelte-sonner'
	import { writable } from 'svelte/store'

	import type { Media, Venue } from '@matterloop/db'
	import { debounce, getMediaUrl } from '@matterloop/util'

	import SelectVenue from './SelectVenue.svelte'
	import Uploader from './ui/Uploader.svelte'

	export let venues: Venue[] = []
	export let media: Media | undefined
	let lastSaved = ''
	let saving = false
	$: store = writable(media)
	$: selectedVenueId = $store?.parentId || venues[0]?.id
	$: venue = venues.find((v) => v.id === selectedVenueId)
	const { call, status, enhance } = trpcCaller(trpc($store).media.update.mutate)
	async function updateAvatar(mediaId: string) {
		queueMicrotask(() => invalidateAll())
	}
	async function submitRaw() {
		if (saving) return
		if (lastSaved !== JSON.stringify($store)) {
			const inited = lastSaved
			lastSaved = JSON.stringify($store)
			if (!inited) return
			saving = true
			const res = await call({
				...$store,
			})
			saving = false
			toast.success('Map Updated')
		}
	}

	const save = debounce(submitRaw, 900)
	$: (save(), $store)
</script>

<div class="rounded-lg bg-stone-50/80 p-2">
	<div class="flex items-center gap-3">
		{#if $store?.version}
			<img src={getMediaUrl($store)} alt="at" class="mx-auto my-2 w-48" />
		{/if}
		<div class="flex-grow">
			<Uploader parentType="venueMap" parentId={selectedVenueId} onSuccess={updateAvatar} />
		</div>
	</div>
	{#if $store?.version}
		<div class="mt-3 flex flex-col items-start justify-center gap-1">
			<Label for="venue" class="text-right">Venue</Label>
			<SelectVenue bind:value={$store.parentId} />
		</div>
		<div class="mt-3 flex flex-col items-start justify-center gap-1">
			<Label for="title" class="text-right">Title</Label>
			<Input id="title" type="text" bind:value={$store.title} class="col-span-3" />
		</div>
		<div class="mt-3 flex flex-col items-start justify-center gap-1">
			<Label for="title" class="text-right">Description</Label>
			<Input id="title" type="text" bind:value={$store.descr} class="col-span-3" />
		</div>
	{/if}
</div>
