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
	import Switch from '$lib/components/ui/switch/switch.svelte'
	import { Textarea } from '$lib/components/ui/textarea'
	import Uploader from '$lib/components/ui/Uploader.svelte'
	import { trpc } from '$lib/trpc/client.js'
	import X from 'lucide-svelte/icons/x'
	import { toast } from 'svelte-sonner'

	import type { Event, FullEventUser } from '@matterloop/db'
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
	let eventUserType = { value: 'attendee', label: 'Attendee' }
	let eventUserTypes = [
		{ value: 'attendee', label: 'Attendee' },
		{ value: 'host', label: 'Host' },
		{ value: 'moderator', label: 'Moderator' },
		{ value: 'attendee', label: 'Attendee' },
		{ value: 'mc', label: 'MC' },
		{ value: 'speaker', label: 'Speaker' },
		{ value: 'panelist', label: 'Panelist' },
		{ value: 'facilitator', label: 'Facilitator' },
		{ value: 'staff', label: 'Staff' },
		{ value: 'volunteer', label: 'Volunteer' },
	]
	let eventTypes = [
		{ value: 'program', label: 'Program Event' },
		{ value: 'panel', label: 'Panel' },
		{ value: 'meetup', label: 'Meetup' },
		{ value: 'meal', label: 'Group Meal' },
		{ value: 'excursion', label: 'Excursion' },
		{ value: 'dive-session', label: 'Dive Session' },
	]
	let eventForOptions = [
		{ value: 'all', label: 'All Attendees' },
		{ value: 'full', label: 'Full Attendees' },
		{ value: 'main-stage', label: 'Main Stage' },
		{ value: 'selected', label: 'Selected Attendees' },
		{ value: 'rsvp', label: 'Allow RSVPs' },
	]
	$: buttonMsg = event?.id ? 'Save Event' : 'Add Event'
	$: editing = event?.id ? true : false
	$: title = editing ? event?.name : 'Add an Event'
	let type = eventTypes.find((t) => t.value === (event.type || 'program'))
	let eventFor = eventForOptions.find((t) => t.value === (event.eventFor || ''))
	$: event.type = type.value
	$: event.eventFor = eventFor?.value
	async function createEvent() {
		const ord = event?.ord || 0
		const res = await trpc().event.upsert.mutate({
			...event,
			ord: +ord,
			maxAttendees: +(event?.maxAttendees || 0),
		})
		goto(`/manage/events/${res.id}`)
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
				<div class="grid grid-cols-2 gap-2">
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
										<Select.Item {value} {label}>{label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
							<Select.Input name="eventType" />
						</Select.Root>
					</div>
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="event_name" class="text-right">Event For</Label>
						<Select.Root bind:selected={eventFor}>
							<Select.Trigger class="w-[180px]">
								<Select.Value placeholder="Select Type" />
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label></Select.Label>
									{#each eventForOptions as { label, value }}
										<Select.Item {value} {label}>{label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
							<Select.Input name="eventType" />
						</Select.Root>
					</div>
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
					{#if event?.eventFor?.includes('rsvp')}
						<div class="flex flex-col items-start justify-center gap-1">
							<Label for="event_maxAttendees" class="text-right">Max Attendees</Label>
							<Input
								id="event_maxAttendees"
								type="number"
								bind:value={event.maxAttendees}
								class="col-span-3"
							/>
						</div>
					{/if}
					{#if event?.eventFor?.includes('rsvp') || event.eventFor.includes('selected')}
						<div class="mt-0 flex items-center justify-between rounded-md border bg-stone-50 p-3">
							<label for="showAttendeeList" class="text-sm font-medium text-stone-800"
								>Show Attendee List on Event Page</label
							>
							<Switch name="showAttendeeList" bind:checked={event.showAttendeeList} class="" />
						</div>
					{/if}
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="event_ord" class="text-right">Event Order</Label>
						<div class="text-sm text-slate-500">
							Order events will display in if at the same time
						</div>
						<Input id="event_ord" bind:value={event.ord} type="number" class="col-span-3" />
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
						{@const { firstName, lastName, type, id } = user}
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
									trpc().event.removeUser.mutate({ eventId: event.id, userId: user.userId })
									invalidateAll()
								}}
							>
								<X class="h-4 w-4 text-stone-500"></X>
							</Button>
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
										<Select.Item {value} {label}>{label}</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
							<Select.Input name="eventUserType" />
						</Select.Root>
						<AttendeeSearchInput handleClick={addUser} />
					</div>
				</div>
				<div class="mt-4">
					<Label for="event_internalNotes" class="text-right">Internal Notes</Label>
					<Textarea
						id="event_internalNotes"
						bind:value={event.internalNotes}
						class="w-full"
						rows="4"
						placeholder="Add internal notes about this event..."
					/>
				</div>
			</div>
		{/if}
	</div>
</form>
