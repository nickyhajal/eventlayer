<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'
import { onMount } from 'svelte'

import type { Event } from '@matterloop/db'
import { dayjs } from '@matterloop/util'

export let data
onMount(() => {
	if (typeof window !== 'undefined') {
		// var observer = new IntersectionObserver(function (entries) {
		// 	if (!entries[0].isIntersecting) {
		// 		console.log('Elvis has LEFT the building ')
		// 	} else {
		// 		console.log('Elvis has ENTERED the building ')
		// 	}
		// })
		// observer.observe(document.querySelector('#Elvis'))
		window.scrollTo({
			top: document.getElementById(`event-${foundNextEventAt}`)?.offsetTop + 87,
			behavior: 'smooth',
		})
	}
})
$: events = data.events
$: days = events.reduce((acc, event) => {
	const day = dayjs(event.startsAt).format('YYYY-MM-DD')
	if (!acc[day]) acc[day] = []
	acc[day].push(event)
	return acc
}, {})
let foundNextEventAt = -1
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
function isNewMonth(datetime: string) {
	if (month !== dayjs(datetime).format('MMMM')) {
		month = dayjs(datetime).format('MMMM')
		return true
	}
	return false
}
function checkIfUpcoming(event: Event, i: number) {
	if (foundNextEventAt !== -1) return false
	if (dayjs(event.startsAt).isAfter(dayjs('2024-02-02 9:05:00'))) {
		foundNextEventAt = i
		return i
	}
}
</script>

<Screen title="Schedule" bigTitle="Schedule">
	<div class="container mx-auto max-w-7xl px-2">
		<div class="">
			<div
				class="topNav sticky z-40 -mx-3 flex w-[calc(100dvw+0.25rem)] items-center justify-center border-b border-slate-300/50 bg-slate-50 py-2 text-center text-sm text-slate-600"
			>
				<div>All times listed in Mountain Time (MT)</div>
				<!-- {#each Object.keys(days) as day}
					{@const datetime = `${day} 00:00:00`}
					{#if isNewMonth(datetime)}
						{(month = dayjs(datetime).format('MMMM')), ''}
						<div class="p-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
							{dayjs(datetime).format('MMM')}
						</div>
					{/if}
					<button
						class="h-12 w-12 rounded-full bg-slate-100 p-3 text-center text-base font-bold text-slate-800 {selectedDay === day ? 'bg-cyan-600 text-slate-100' : ''}"
					>
						{dayjs(datetime).format('D')}
					</button>
				{/each} -->
			</div>
			<div class="relative w-[calc(100dvw-2rem)] pb-[5vh]">
				<div
					class="fadeRect sticky z-20 -mb-7 h-5 w-full bg-gradient-to-b from-white to-white/0"
				></div>
				{#each data.events as event, i}
					{@const isNew = isNewHour(event)}
					{#if isNew}
						{#if checkIfUpcoming(event, i) === i}
							<span id="scroll-anchor" class=" relative left-0"></span>
						{/if}
						<div
							class="
								timeMarker
								sticky
								left-0 z-30
								-mb-[2.48rem] mt-6 w-16
								rounded-lg border-0 border-slate-200/30 bg-white
								px-2 pb-[5px]
								text-left text-[0.94rem] font-semibold text-slate-700/70"
						>
							<div class="-mb-0.5 text-xs uppercase text-slate-400">
								{dayjs(event.startsAt).format('MMM D').replace('m', '')}
							</div>
							<div>{dayjs(event.startsAt).format('h:mma').replace('m', '')}</div>
						</div>
					{/if}
					<div class="relative grid grid-cols-[4.4rem_1fr]" id="event-{i}">
						<div class="relative">
							{#if !isNew}
								<div class="relative -top-4 left-7 h-full w-1 bg-slate-100"></div>
							{/if}
						</div>
						<EventRow event={event} />
					</div>
				{/each}
			</div>
		</div>
	</div>
</Screen>

<style lang="postcss">
.topNav {
	/* top: 3rem; */
	top: calc((env(safe-area-inset-top) * 0.68) + 3rem);
}
.fadeRect {
	top: calc((env(safe-area-inset-top) * 0.68) + 5.1rem);
}
.timeMarker {
	top: calc((env(safe-area-inset-top) * 0.68) + 6rem);
}
</style>
