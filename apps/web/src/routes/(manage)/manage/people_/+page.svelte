<script lang="ts">
import { goto, invalidate, invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import Datepicker from '$lib/components/ui/Datepicker.svelte'
import DatetimePicker from '$lib/components/ui/DatetimePicker.svelte'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import Label from '$lib/components/ui/label/label.svelte'
import * as Select from '$lib/components/ui/select'
import { trpc } from '$lib/trpc/client.js'
import Plus from 'lucide-svelte/icons/plus'

import UserTable from './UserTable.svelte'

export let data

let addOpen = false
let loading = false

let event = {
	name: '',
	type: 'program',
	startsAt: '2024-01-14 09:00',
}
let type = { value: 'program', label: 'Program' }
let eventTypes = [
	{ value: 'program', label: 'Program Event' },
	{ value: 'panel', label: 'Panel' },
	{ value: 'meetup', label: 'Meetup' },
	{ value: 'meal', label: 'Group Meal' },
	{ value: 'excursion', label: 'Excursion' },
]
$: event.type = type.value
async function createEvent() {
	const res = await trpc().event.upsert.mutate(event)
	goto(`/manage/events/${res.id}`)
}
</script>

<div class="">
	<div class="flex items-center gap-3">
		<div class="text-2xl font-semibold">People</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => addOpen = true}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Person</Button
		>
	</div>
	<UserTable rows={data.events} />
</div>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<form on:submit={createEvent}>
			<Dialog.Header>
				<Dialog.Title>Add a Person</Dialog.Title>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_name" class="text-right">Event Title</Label>
					<Input id="event_name" bind:value={event.name} class="col-span-3" />
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
						<Select.Input name="favoriteFruit" />
					</Select.Root>
				</div>
				<DatetimePicker bind:value={event.startsAt} />
			</div>
			<Dialog.Footer>
				<Button type="submit">Add Event</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
