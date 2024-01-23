<script lang="ts">
import { goto, invalidate, invalidateAll } from '$app/navigation'
import AttendeeSearchInput from '$lib/components/AttendeeSearchInput.svelte'
import SelectVenue from '$lib/components/SelectVenue.svelte'
import { Button } from '$lib/components/ui/button'
import Datepicker from '$lib/components/ui/Datepicker.svelte'
import DatetimePicker from '$lib/components/ui/DatetimePicker.svelte'
import * as Dialog from '$lib/components/ui/dialog'
import * as DropdownMenu from '$lib/components/ui/dropdown-menu'
import { Input } from '$lib/components/ui/input'
import Label from '$lib/components/ui/label/label.svelte'
import * as Select from '$lib/components/ui/select'
import { Textarea } from '$lib/components/ui/textarea'
import Uploader from '$lib/components/ui/Uploader.svelte'
import { trpc } from '$lib/trpc/client.js'
import { toast } from 'svelte-sonner'

import type { Event, FullEventUser, User } from '@matterloop/db'
import { tw } from '@matterloop/ui'
import { capitalize, debounce, getMediaUrl } from '@matterloop/util'

export let simplified = false
export let inDialog = false
export let titleClass = ''
export let users: FullEventUser[] = []
export let event: Partial<Event> = {
	name: '',
	subtitle: '',
}

let loading = false
let userSearchQuery = ''
let eventUserType = { value: 'host', label: 'Host' }
let eventUserTypes = [
	{ value: 'attendee', label: 'Attendee' },
	{ value: 'host', label: 'Host' },
	{ value: 'moderator', label: 'Moderator' },
	{ value: 'speaker', label: 'Speaker' },
	{ value: 'panelist', label: 'Panelist' },
	{ value: 'staff', label: 'Staff' },
	{ value: 'volunteer', label: 'Volunteer' },
].filter((t) => t.value !== 'attendee')
let eventTypes = [
	{ value: 'program', label: 'Program Event' },
	{ value: 'panel', label: 'Panel' },
	{ value: 'meetup', label: 'Meetup' },
	{ value: 'meal', label: 'Group Meal' },
	{ value: 'excursion', label: 'Excursion' },
]
$: buttonMsg = event?.id ? 'Save Event' : 'Add Event'
$: editing = event?.id ? true : false
$: title = editing ? event?.name : 'Add an Event'
let type = eventTypes.find((t) => t.value === event.type || t.value === 'program')
$: event.type = type.value
async function createEvent() {
	const res = await trpc().event.upsert.mutate(event)
	toast.success('Saved')
}
async function updateAvatar(mediaId: string) {
	trpc().event.upsert.mutate({ id: event.id, mediaId })
	invalidateAll()
}
async function addUser(user: FullEventUser) {
	if (eventUserType?.value && event.id && user.userId) {
		await trpc().event.addUser.mutate({
			type: eventUserType.value,
			eventId: event.id,
			userId: user.userId,
		})
		invalidateAll()
	}
}
</script>

<form on:submit={createEvent}>
	<div class="grid {inDialog ? 'grid-cols-1 px-0' : 'grid-cols-[24rem_24rem] px-4'} gap-8">
		<div>
			{#if inDialog}
				<Dialog.Header>
					<Dialog.Title>{title}</Dialog.Title>
				</Dialog.Header>
			{:else}
				<div class={tw(`mb-2 mt-0 text-lg font-semibold ${titleClass}`)}>{title}</div>
			{/if}
			<div class="grid gap-4 py-4">
				{#if !simplified && event?.id}
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="image" class="text-right">Event Image</Label>
					</div>
					<div
						class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
					>
						{#if event.photo}
							<img src={getMediaUrl(event.photo)} alt="at" class="w-full" />
						{/if}
						<div class="w-full bg-stone-100">
							<Uploader parentId={event.id} parentType="event" onSuccess={updateAvatar} />
						</div>
					</div>
				{/if}
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_name" class="text-right">Event Title</Label>
					<Input id="event_name" bind:value={event.name} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_subtitle" class="text-right">Sub Title</Label>
					<Input id="event_subtitle" bind:value={event.subtitle} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_name" class="text-right">Event Type</Label>
					<Select.Root bind:selected={type}>
						<Select.Trigger class="w-[180px]">
							<Select.Value placeholder="Select Type" />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Event Type</Select.Label>
								{#each eventTypes as { label, value }}
									<Select.Item value={value} label={label}>{label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="eventType" />
					</Select.Root>
				</div>
				<DatetimePicker bind:value={event.startsAt} />
				{#if !simplified}
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="description" class="text-right">Description</Label>
						<Textarea id="description" bind:value={event.description} class="col-span-3" />
					</div>
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="venue" class="text-right">Event Venue</Label>
						<SelectVenue bind:value={event.venueId} />
					</div>
				{/if}
			</div>
			<Button type="submit">{buttonMsg}</Button>
		</div>
		{#if !simplified}
			<div class="grip mt-9 gap-4 px-4 py-4">
				<div class="text-lg font-semibold">People</div>
				<div
					class="mb-1 mt-1 flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200"
				>
					{#each users || [] as user}
						{@const {firstName, lastName, type} = user}
						<div class="flex items-center justify-between px-3 py-2">
							<div class="text-sm font-medium text-stone-600">{firstName} {lastName}</div>
							<div class="text-xs text-stone-500">{capitalize(type)}</div>
						</div>
					{:else}
						<div class="text-sm text-center text-gray-500 py-6">No users yet.</div>
					{/each}
				</div>
				<div class="rounded-lg bg-stone-100 p-2">
					<div class="mb-0.5 pl-0.5 text-sm font-medium text-gray-500">Add People</div>
					<div class="relative flex gap-1">
						<Select.Root bind:selected={eventUserType}>
							<Select.Trigger class="w-[8rem] bg-white">
								<Select.Value placeholder="Select Type" />
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Type</Select.Label>
									{#each eventUserTypes as { label, value }}
										<Select.Item value={value} label={label}>{label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
							<Select.Input name="eventUserType" />
						</Select.Root>
						<AttendeeSearchInput handleClick={addUser} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</form>
