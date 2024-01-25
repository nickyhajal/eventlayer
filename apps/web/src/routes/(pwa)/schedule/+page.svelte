<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

import type { Event } from '@matterloop/db'
import { dayjs } from '@matterloop/util'

export let data
$: events = data.events
$: days = events.reduce((acc, event) => {
	const day = dayjs(event.startsAt).format('YYYY-MM-DD')
	if (!acc[day]) acc[day] = []
	acc[day].push(event)
	return acc
}, {})
$: selectedDay = Object.keys(days)[0]
let month = ''
let hour = ''
const me = getMeContext()
function isNewHour(event: Event) {
	if (hour !== dayjs(event.startsAt).format('h:mm a')) {
		hour = dayjs(event.startsAt).format('h:mm a')
		return true
	}
	return false
}
</script>

<Screen title="Schedule" bigTitle="Schedule">
	<div class="container mx-auto max-w-7xl">
		<div class="">
			<div
				class="sticky top-12 z-40 -mx-3 flex items-center border-b border-slate-300/50 bg-slate-50 py-2"
			>
				{#each Object.keys(days) as day}
					{@const datetime = `${day} 00:00:00`}
					{#if month !== dayjs(datetime).format('MMMM')}
						<div class="p-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
							{dayjs(datetime).format('MMM')}
						</div>
					{/if}
					<button
						class="h-12 w-12 rounded-full bg-slate-100 p-3 text-center text-base font-bold text-slate-800 {selectedDay === day ? 'bg-cyan-600 text-slate-100' : ''}"
					>
						{dayjs(datetime).format('D')}
					</button>
				{/each}
			</div>
			<div class="relative w-[calc(100vw-2.5rem)]">
				<div
					class="sticky top-28 z-20 -mb-12 h-10 w-full bg-gradient-to-b from-white to-white/0"
				></div>
				{#each data.events as event}
					{#if isNewHour(event)}
						<div
							class="sticky top-32 z-30 mx-auto mb-2 mt-6 w-fit rounded-lg border border-b-2 border-slate-200/50 bg-slate-50 px-3 py-[5px] pt-[5px] text-sm font-medium text-slate-700/80"
						>
							{dayjs(event.startsAt).format('h:mm a')}
						</div>
					{/if}
					<EventRow event={event} />
				{/each}
			</div>
		</div>
	</div>
</Screen>
