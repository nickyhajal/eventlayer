<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import AttendeeSearchInput from '$lib/components/AttendeeSearchInput.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import * as Dialog from '$lib/components/ui/dialog'
import Input from '$lib/components/ui/input/input.svelte'
import Label from '$lib/components/ui/label/label.svelte'
import * as Select from '$lib/components/ui/select'
import Textarea from '$lib/components/ui/textarea/textarea.svelte'
import Uploader from '$lib/components/ui/Uploader.svelte'
import { trpc } from '$lib/trpc/client.js'
import { getMediaUrl } from '$lib/util/getMediaUrl'
import X from 'lucide-svelte/icons/x'
import { toast } from 'svelte-sonner'

import type { FullEventUser, Sponsor } from '@matterloop/db'
import { capitalize, tw } from '@matterloop/util'

export let sponsor: Partial<Sponsor> = {
	title: '',
	url: '',
	description: '',
}
export let simplified = false
export let inDialog = false
export let users: FullEventUser[] = []
export let titleClass = ''
$: buttonMsg = sponsor?.id ? 'Save Sponsor' : 'Add Sponsor'
$: editing = sponsor?.id ? true : false
$: title = editing ? sponsor?.title : 'Add a Sponsor'
let sponsorTypes = [
	{ value: 'building', label: 'Building' },
	{ value: 'room', label: 'Room' },
]
let type = sponsor?.type
	? sponsorTypes.find(({ value }) => value === sponsor?.type)
	: { value: 'building', label: 'Building' }
$: sponsor.type = type.value
let image = ''
let addOpen = false
async function createSponsor() {
	const res = await trpc().sponsor.upsert.mutate(sponsor)
	goto(`/manage/sponsors/${res.id}`)
	toast.success('Sponsor Saved')
}
async function updateAvatar(mediaId: string) {
	trpc().sponsor.upsert.mutate({ id: sponsor.id, mediaId })
	invalidateAll()
}
async function addUser(user: FullEventUser) {
	if (sponsor?.id && user.userId) {
		await trpc().sponsor.addRep.mutate({
			sponsorId: sponsor.id,
			eventUserId: user.id,
		})
		invalidateAll()
	}
}
</script>

<div class="grid grid-cols-[22rem_24rem] gap-8">
	<form on:submit={createSponsor}>
		{#if inDialog}
			<Dialog.Header>
				<Dialog.Title>{title}</Dialog.Title>
			</Dialog.Header>
		{:else}
			<div class={tw(`mb-2 mt-0 text-lg font-semibold ${titleClass}`)}>{title}</div>
		{/if}
		<div class="grid gap-4 py-4">
			{#if !simplified && sponsor?.id}
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="image" class="text-right">Sponsor Image</Label>
				</div>
				<div
					class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
				>
					{#if sponsor.photo}
						<img src={getMediaUrl(sponsor.photo)} alt="at" class="w-full" />
					{/if}
					<div class="w-full bg-stone-100">
						<Uploader parentId={sponsor.id} parentType="sponsor" onSuccess={updateAvatar} />
					</div>
				</div>
			{/if}
			<!-- <div class="flex flex-col items-start justify-center gap-1">
					<Label for="sponsor_name" class="text-right">Sponsor Type</Label>
					<Select.Root bind:selected={type}>
						<Select.Trigger class="w-[180px]">
							<Select.Value placeholder="Select Type" />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Sponsor Type</Select.Label>
								{#each sponsorTypes as { label, value }}
									<Select.Item value={value} label={label}>{label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="sponsorType" />
					</Select.Root>
				</div> -->
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="title" class="text-right">Sponsor Title</Label>
				<Input id="title" bind:value={sponsor.title} class="col-span-3" />
			</div>
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="url" class="text-right">Sponsor Link</Label>
				<Input id="url" bind:value={sponsor.url} type="url" class="col-span-3" />
			</div>
			{#if !simplified}
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="descriptin" class="text-right">Description</Label>
					<Textarea id="description" bind:value={sponsor.description} class="col-span-3" />
				</div>
			{/if}
			<div class="flex justify-end"><Button type="submit">{buttonMsg}</Button></div>
		</div>
	</form>
	{#if !simplified}
		<div class="grip mt-9 gap-4 px-4 py-4">
			<div class="text-lg font-semibold">Sponsor Reps</div>
			<div
				class="mb-1 mt-1 flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200"
			>
				{#each sponsor.users || [] as { id, user }}
					{@const {firstName, lastName, type} = user}
					<div class="group relative flex items-center justify-between gap-2 px-2.5 py-2">
						<div class="flex w-full items-center justify-between">
							<div class="text-sm font-medium text-stone-600">{firstName} {lastName}</div>
							<div
								class="absolute right-3 text-xs text-stone-500 transition-all group-hover:right-10"
							>
								{capitalize(type)}
							</div>
						</div>
						<Button
							variant="ghost"
							class="my-0 h-6 px-1 py-2 opacity-0 transition-all group-hover:opacity-100"
							on:click={() => {
										trpc().sponsor.removeRep.mutate({ eventUserId: id })
										invalidateAll()
									}}
						>
							<X class="h-4 w-4 text-stone-500"></X>
						</Button>
					</div>
				{:else}
					<div class="text-sm text-center text-gray-500 py-6">None yet.</div>
				{/each}
			</div>
			<div class="rounded-lg bg-stone-100 p-2">
				<div class="mb-0.5 pl-0.5 text-sm font-medium text-gray-500">Add Rep</div>
				<AttendeeSearchInput handleClick={addUser} />
			</div>
		</div>
	{/if}
</div>
