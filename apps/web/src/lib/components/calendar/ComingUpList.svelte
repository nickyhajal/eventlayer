<script lang="ts">
import { dayjs } from '@matterloop/util'
import type { CalendarEventClient } from '$lib/server/procedures/event'

import ComingUpRow from './ComingUpRow.svelte'

let className = ''

export { className as class }
export let events: CalendarEventClient[] = []

const today = dayjs().format('YYYY-MM-DD')
const sundayOfThisWeek = dayjs().add(-dayjs().day(), 'day').format('YYYY-MM-DD') //first date of this week
const sundayOfNextWeek = dayjs(sundayOfThisWeek).add(7, 'day').format('YYYY-MM-DD') //first date of next week
$: todayEvents = events.filter((event) => dayjs(event.startAt).format('YYYY-MM-DD') === today)
$: weekEvents = events.filter((event) => {
	const startDay = dayjs(event.startAt).format('YYYY-MM-DD')
	return startDay !== today && startDay >= sundayOfThisWeek && startDay < sundayOfNextWeek
})
$: laterEvents = events
	.filter((event) => dayjs(event.startAt).format('YYYY-MM-DD') >= sundayOfNextWeek)
	.slice(0, 4)
</script>

<div class={`${className} text-center`}>
	<h1
		class="mb-4 flex h-14 items-center justify-center border-b border-gray-700 p-4 text-sm font-semibold"
	>
		Coming Up
	</h1>
	{#if !todayEvents.length && !weekEvents.length && !laterEvents.length}
		<h1 class="mx-5 mt-10 rounded-lg bg-white px-10 py-5 text-sm leading-relaxed text-gray-800">
			Events will appear here once scheduled. Check back soon!
		</h1>
	{:else}
		{#if todayEvents.length}
			<h1 class="font-title pl-5 text-left text-base font-semibold text-gray-900">Today</h1>
			{#each todayEvents as event}
				<ComingUpRow event={event} on:itemClick />
			{:else}
				<h1 class="mt-2 text-gray-700">No events</h1>
			{/each}
		{/if}
		{#if weekEvents.length}
			<h1 class="font-title pl-5 text-left text-base font-semibold text-gray-900">This Week</h1>
			{#each weekEvents as event}
				<ComingUpRow event={event} on:itemClick />
			{:else}
				<h1 class="mt-2 text-gray-700">No events</h1>
			{/each}
		{/if}
		<h1 class="font-title pl-5 text-left text-base font-semibold text-gray-900">Later On</h1>
		{#each laterEvents as event}
			<ComingUpRow event={event} on:itemClick />
		{:else}
			<h1 class="mt-2 text-gray-700 text-sm bg-white mx-5 rounded-lg p-3">No events, yet.</h1>
		{/each}
	{/if}
</div>
