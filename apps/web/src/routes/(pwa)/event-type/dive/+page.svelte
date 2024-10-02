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

<Screen title="Dive Teams" bigTitle="Dive Teams">
	<div class="mb-8 max-w-2xl mt-16 px-4 sm:px-0">
		<p class="text-lg mb-4">
			Dive Team sessions are breakout working groups that gather decision makers and innovators in
			the clinical trial industry to discuss and find solutions to challenges within the sector for
			lasting impact beyond the conference.
		</p>
		<p class="text-lg mb-4">
			They are designed to facilitate working shoulder to shoulder with industry leaders, diving
			into in-depth conversations on challenging topics that produce tangible outcomes.
		</p>
		<p class="text-lg mb-4">
			The term “Dive Teams” are inspired by remarkable individuals that by working together explore
			the deepest part of the world, the Mariana Trench.
		</p>
		<p class="text-lg">
			What can we discover and accomplish when we bring the best people together in the pursuit of
			advancing the Clinical Trial industry for all?
		</p>
	</div>
	{#if mine}
		<div class="bg-emerald-50 p-4 text-emerald-700 font-semibold rounded-xl mb-3">
			Your Dive Team is: {mine.name}
		</div>
	{:else}{/if}
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
								<span class="text-green-500 font-semibold">Your Dive Team</span>
							{/if}
						</div>
					</div>
				</Button>
			{/each}
		</div>
	</div></Screen
>
