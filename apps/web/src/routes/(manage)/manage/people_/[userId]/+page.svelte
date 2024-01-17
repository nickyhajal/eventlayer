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
import toast from 'svelte-french-toast'

import { HeroIcon } from '@matterloop/ui'

export let data

let loading = false
let eventTypes = [
	{ value: 'program', label: 'Program Event' },
	{ value: 'panel', label: 'Panel' },
	{ value: 'meetup', label: 'Meetup' },
	{ value: 'meal', label: 'Group Meal' },
	{ value: 'excursion', label: 'Excursion' },
]
let event = data.event
let type = eventTypes.find((t) => t.value === event.type)
$: event.type = type.value
async function createEvent() {
	const res = await trpc().event.upsert.mutate(event)
	toast.success('Saved')
}
$: console.log('ev', event.startsAt)
</script>

<div class="grid grid-cols-[20rem_1fr] px-4">
	<div>
		<div class="text-2xl font-semibold">{event.name}</div>
		<form on:submit={createEvent}>
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
			<Button type="submit">Save Event</Button>
		</form>
	</div>
</div>
