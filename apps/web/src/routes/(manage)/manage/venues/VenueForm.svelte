<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import Button from '$lib/components/ui/button/button.svelte'
import * as Dialog from '$lib/components/ui/dialog'
import Input from '$lib/components/ui/input/input.svelte'
import Label from '$lib/components/ui/label/label.svelte'
import * as Select from '$lib/components/ui/select'
import Textarea from '$lib/components/ui/textarea/textarea.svelte'
import Uploader from '$lib/components/ui/Uploader.svelte'
import { trpc } from '$lib/trpc/client.js'
import { getMediaUrl } from '$lib/util/getMediaUrl'
import { Upload } from 'radix-icons-svelte'
// import toast from 'svelte-french-toast'
import { toast } from 'svelte-sonner'

import type { Venue } from '@matterloop/db'
import { tw } from '@matterloop/util'

export let venue: Partial<Venue> = {
	name: '',
	type: 'building',
	description: '',
}
export let simplified = false
export let inDialog = false
export let titleClass = ''
$: buttonMsg = venue?.id ? 'Save Venue' : 'Add Venue'
$: editing = venue?.id ? true : false
$: title = editing ? venue?.name : 'Add a Venue'
let type = { value: 'building', label: 'Building' }
let venueTypes = [
	{ value: 'building', label: 'Building' },
	{ value: 'room', label: 'Room' },
]
$: venue.type = type.value
let image = ''
async function createVenue() {
	const res = await trpc().venue.upsert.mutate(venue)
	goto(`/manage/venues/${res.id}`)
	toast.success('Venue Saved')
}
async function updateAvatar(mediaId: string) {
	trpc().venue.upsert.mutate({ id: venue.id, mediaId })
	invalidateAll()
}
</script>

<form on:submit={createVenue}>
	{#if inDialog}
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
		</Dialog.Header>
	{:else}
		<div class={tw(`mb-2 mt-0 text-lg font-semibold ${titleClass}`)}>{title}</div>
	{/if}
	<div class="grid gap-4 py-4">
		{#if !simplified && venue?.id}
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="image" class="text-right">Venue Image</Label>
			</div>
			<div
				class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
			>
				{#if venue.photo}
					<img src={getMediaUrl(venue.photo)} alt="at" class="w-full" />
				{/if}
				<div class="w-full bg-stone-100">
					<Uploader parentId={venue.id} parentType="venue" onSuccess={updateAvatar} />
				</div>
			</div>
		{/if}
		<div class="flex flex-col items-start justify-center gap-1">
			<Label for="venue_name" class="text-right">Venue Type</Label>
			<Select.Root bind:selected={type}>
				<Select.Trigger class="w-[180px]">
					<Select.Value placeholder="Select Type" />
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Label>Venue Type</Select.Label>
						{#each venueTypes as { label, value }}
							<Select.Item value={value} label={label}>{label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
				<Select.Input name="venueType" />
			</Select.Root>
		</div>
		<div class="flex flex-col items-start justify-center gap-1">
			<Label for="venue_name" class="text-right">Venue Name</Label>
			<Input id="venue_name" bind:value={venue.name} class="col-span-3" />
		</div>
		<div class="flex flex-col items-start justify-center gap-1">
			<Label for="address" class="text-right">Address</Label>
			<Input id="address" bind:value={venue.address} class="col-span-3" />
		</div>
		{#if !simplified}
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="descriptin" class="text-right">Description</Label>
				<Textarea id="description" bind:value={venue.description} class="col-span-3" />
			</div>
		{/if}
	</div>
	<div class="flex justify-end"><Button type="submit">{buttonMsg}</Button></div>
</form>
