<script lang="ts">
	import EventRow from '$lib/components/EventRow.svelte'
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import { getEventContext, getMeContext } from '$lib/state/getContexts'
	import { onMount } from 'svelte'

	import type { Event } from '@matterloop/db'
	import { dayjs, getMediaUrl } from '@matterloop/util'

	export let data
	const me = getMeContext()
	$: events = data.events || []
	$: mine = data.myLunch?.eventId ? events.find((event) => event.id === data.myLunch.eventId) : null
</script>

<Screen title="Day 1: Lunch Options" bigTitle="Day 1: Lunch Options">
	<div class="mb-8 max-w-2xl mt-16 px-4 md:px-0">
		<p class="text-lg mb-4">
			Select from the following lunch options to learn more and make sure to RSVP for one of them to
			add it to your schedule.
		</p>
	</div>
	{#if mine}
		<div class="bg-emerald-50 p-4 text-emerald-700 font-semibold rounded-xl mb-3">
			You're signed up for {mine.name}
		</div>
	{:else}
		<div class="bg-amber-50 p-4 text-amber-800/70 font-semibold rounded-xl mb-3">
			You haven't signed up for lunch yet
		</div>
	{/if}
	<div class="pb-24 mb-6 w-[calc(100dvw-0.9rem)] overflow-x-auto lg:w-[calc(100%)] lg:pb-8">
		<div
			class="grid sm:grid-cols-2 grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-4 pb-4 pr-6 lg:w-[calc(100%)] lg:pr-0"
		>
			{#each events as event, i}
				{@const spotsLeft = event.maxAttendees - event.users.length}
				<Button
					variant="outline"
					href={`/schedule/${event.id}`}
					class="h-54 relative mt-2 flex w-[15rem] mx-auto flex-col items-start justify-start rounded-xl p-1 text-left lg:w-full"
				>
					<img
						alt="{event.name} photo"
						src={getMediaUrl(event.photo)}
						class="h-32 w-full rounded-md bg-cover object-cover"
					/>
					<div class="px-2">
						<div
							class="w-full line-clamp-1 truncate whitespace-normal pb-1 pt-2 text-base font-semibold leading-tight text-slate-700"
						>
							{event.name}
						</div>
						<div class="-mt-0.5 mb-1 text-slate-500">
							<!-- {console.log(event)} -->
							<!-- {data?.myLunch?.eventId} hey -->
							<!-- {event.id} -->
							{#if data.myLunch?.eventId === event.id}
								<span class="text-green-500 font-semibold">You're signed up!</span>
							{:else}
								{spotsLeft} spots left
							{/if}
						</div>
					</div>
				</Button>
			{/each}
		</div>
	</div></Screen
>
