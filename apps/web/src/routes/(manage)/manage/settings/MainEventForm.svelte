<script lang="ts">
import { goto, invalidate, invalidateAll } from '$app/navigation'
import AttendeeSearchInput from '$lib/components/AttendeeSearchInput.svelte'
import SelectVenue from '$lib/components/SelectVenue.svelte'
import { Button } from '$lib/components/ui/button'
import DatetimePicker from '$lib/components/ui/DatetimePicker.svelte'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import Label from '$lib/components/ui/label/label.svelte'
import * as Select from '$lib/components/ui/select'
import { Textarea } from '$lib/components/ui/textarea'
import Uploader from '$lib/components/ui/Uploader.svelte'
import { trpc } from '$lib/trpc/client.js'
import X from 'lucide-svelte/icons/x'
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
	colors: { accent: '' },
}

let loading = false
let userSearchQuery = ''
let eventUserType = { value: 'host', label: 'Host' }
let eventUserTypes = [
	{ value: 'attendee', label: 'Attendee' },
	{ value: 'host', label: 'Host' },
	{ value: 'moderator', label: 'Moderator' },
	{ value: 'mc', label: 'MC' },
	{ value: 'speaker', label: 'Speaker' },
	{ value: 'panelist', label: 'Panelist' },
	{ value: 'facilitator', label: 'Facilitator' },
	{ value: 'staff', label: 'Staff' },
	{ value: 'volunteer', label: 'Volunteer' },
].filter((t) => t.value !== 'attendee')
// let eventTypes = [
// 	{ value: 'main', label: 'Main Event' },
// 	{ value: 'program', label: 'Program Event' },
// 	{ value: 'panel', label: 'Panel' },
// 	{ value: 'meetup', label: 'Meetup' },
// 	{ value: 'meal', label: 'Group Meal' },
// 	{ value: 'excursion', label: 'Excursion' },
// ]
$: buttonMsg = event?.id ? 'Save Event' : 'Add Event'
$: editing = event?.id ? true : false
$: event.colors = event.colors || { accent: '' }
$: title = editing ? event?.name : 'Add an Event'
// let type = eventTypes.find((t) => t.value === (event.type || 'program'))
async function createEvent() {
	const res = await trpc().event.upsert.mutate(event)
	toast.success('Saved')
}
async function updateMedia(mediaId: string, remoteKey: string) {
	trpc().event.upsert.mutate({ id: event.id, [remoteKey]: mediaId })
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
				<div class={tw(`mb-2 mt-0 text-2xl font-semibold ${titleClass}`)}>{title} Settings</div>
			{/if}
			<div class="grid gap-4 py-4">
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_name" class="text-right">Event Title</Label>
					<Input id="event_name" bind:value={event.name} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_subtitle" class="text-right">Sub Title</Label>
					<Input id="event_subtitle" bind:value={event.subtitle} class="col-span-3" />
				</div>
				<!-- <div class="flex flex-col items-start justify-center gap-1">
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
				</div> -->
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
		{#if !simplified && event?.id}
			<div class="mt-9 grid gap-4 px-4 py-4">
				<div>
					<div class="flex flex-col items-start justify-center gap-1 pb-1">
						<Label for="image" class="text-right">Event Image</Label>
					</div>
					<div
						class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
					>
						{#if event.photo}
							<img src={getMediaUrl(event.photo)} alt="at" class="w-full" />
						{/if}
						<div class="w-full bg-stone-100">
							<Uploader
								parentId={event.id}
								parentType="event"
								onSuccess={(mediaId) => updateMedia(mediaId, 'mediaId')}
							/>
						</div>
					</div>
				</div>
				<div>
					<div class="flex flex-col items-start justify-center gap-1 pb-1">
						<Label for="image" class="text-right">Event Large Logo</Label>
					</div>
					<div
						class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
					>
						{#if event.largeLogoId}
							<img src={getMediaUrl(event.largeLogo)} alt="at" class="w-full" />
						{/if}
						<div class="w-full bg-stone-100">
							<Uploader
								parentId={event.id}
								parentType="event-large-logo"
								onSuccess={(mediaId) => updateMedia(mediaId, 'largeLogoId')}
							/>
						</div>
					</div>
				</div>
				<div>
					<div class="flex flex-col items-start justify-center gap-1 pb-1">
						<Label for="image" class="text-right">Favicon Image</Label>
					</div>
					<div
						class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
					>
						{#if event.faviconId}
							<img src={getMediaUrl(event.favicon)} alt="at" class="w-full" />
						{/if}
						<div class="w-full bg-stone-100">
							<Uploader
								parentId={event.id}
								parentType="event-favicon"
								onSuccess={(mediaId) => updateMedia(mediaId, 'faviconId')}
							/>
						</div>
					</div>
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_accent" class="text-right">Accent Color</Label>
					<Input id="event_accent" bind:value={event.colors.accent} class="col-span-3" />
				</div>
			</div>
		{/if}
	</div>
</form>
