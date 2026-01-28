<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation'
	import EventRow from '$lib/components/EventRow.svelte'
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import UserBlock from '$lib/components/UserBlock.svelte'
	import VenueBlock from '$lib/components/VenueBlock.svelte'
	import { getMeContext } from '$lib/state/getContexts'
	import { trpc } from '$lib/trpc/client'

	import type { Event, EventUser } from '@matterloop/db'
	import Markdown from '@matterloop/ui/src/components/Markdown.svelte'
	import { capitalize, dayjs, orderBy, startCase } from '@matterloop/util'

	export let data
	const me = getMeContext()
	let loading = false
	$: shouldGroup = data.event.eventFor === 'rsvp'
	$: event = data.event
	$: users = orderBy(
		shouldGroup ? data.users : data.users.map((row) => ({ ...row, type: 'attendee' })),
		['type'],
		'desc',
	)
	$: rsvpd = $me?.rsvps?.find(
		(rsvp) => rsvp.event.startsAt.replace('T', ' ') === event.startsAt?.replace('T', ' '),
	)
	// $: users = shouldGroup ? orderBy(data.users, ['type']) : data.users
	$: attendingEvent = users.find((user) => user?.userId === $me?.id)
	$: canRsvp = event?.maxAttendees === 0 || users.length < (event?.maxAttendees || 0)
	let lastType = ''
	function getLastType(user: EventUser) {
		if (user.type !== lastType && user.type) {
			lastType = user.type
			return true
		}
	}

	async function toggleRsvp() {
		if (!event?.id || !$me?.id) return
		if (!attendingEvent && !canRsvp) return
		if (loading) return
		loading = true
		attendingEvent = !attendingEvent
		await trpc().event.toggleRsvp.mutate({ eventId: event.id })
		await invalidateAll()
		loading = false
	}
	function getUserTitle(type) {
		if (type === 'staff') return 'Team'
		const title = startCase(type)
		return title
	}
</script>

<Screen
	title={data.event.name}
	bigTitle={event.photo ? ' ' : ''}
	back="/schedule"
	photo={event.photo}
>
	<div class="shell mx-auto max-w-7xl pb-20 pt-safe-offset-3">
		<div class="text-base font-semibold text-a-accent">
			{dayjs(data.event.startsAt).format('dddd MMMM Do [at] h:mma')}
		</div>
		<div class="pb-3 text-3xl font-bold">{event.name}</div>
		{#if event.subtitle}
			<div class="-mt-2 pb-3 pr-6 text-base font-semibold leading-snug text-slate-600">
				{event.subtitle}
			</div>
		{/if}
		<div class="">
			{#if event.eventFor === 'rsvp'}
				<Button
					on:click={toggleRsvp}
					class="mb-8 font-semibold {attendingEvent
						? '!bg-emerald-500'
						: canRsvp && $me?.id && !rsvpd
							? 'bg-a-accent !text-white/100'
							: 'cursor-not-allowed border border-slate-400/10 border-b-slate-700/10 !bg-slate-100/60 !text-slate-400'}"
				>
					{#if loading}
						Loading...
					{:else if attendingEvent}
						You're Attending - Click to Cancel
					{:else if rsvpd}
						You Already Have an RSVP at this Time
					{:else if !canRsvp}
						Event Full
					{:else if !$me?.id}
						Login to RSVP
					{:else if event.type === 'meal'}
						RSVP to this Lunch
					{:else}
						RSVP to this Event
					{/if}
				</Button>
			{/if}
			<!-- {#if event.showAttendeeList}
				<button>Show Attendees</button>
			{/if} -->
		</div>
		{#if event.description}
			<div class="text-slate-600">
				<Markdown data={event.description} />
			</div>
		{/if}
		{#if event?.venue}
			<div class="mt-8">
				<VenueBlock venue={event.venue} />
			</div>
		{/if}
		{#if users?.length > 0 && event?.showAttendeeList}
			<div class="mt-3 flex flex-col gap-2">
				{#if !shouldGroup}
					<div class="mb-0 mt-2 text-lg font-semibold text-a-accent brightness-95">
						Attending this Event
					</div>
				{/if}
				{#each users as user}
					{#if shouldGroup}
						{#if getLastType(user)}
							<div class="mb-0 mt-2 text-lg font-semibold text-a-accent brightness-95">
								{getUserTitle(user.type)}
							</div>
						{/if}
					{/if}
					<UserBlock user={{ photo: user.photo, ...user }} />
				{/each}
			</div>
		{/if}
	</div>
</Screen>

<style lang="postcss">
	.shell {
		@apply text-slate-600;

		:global(h1) {
			@apply mb-6 mt-5 pr-2 text-3xl font-semibold text-slate-600/70;
		}
		:global(h2) {
			@apply mb-6 mt-7 text-2xl font-bold;
		}
		:global(h3) {
			@apply mb-6 mt-7 text-xl font-bold;
		}
		:global(ul) {
			@apply ml-4 pl-0.5;
		}
		:global(li) {
			@apply mb-1.5 list-disc;
		}
		:global(p) {
			@apply mb-6 text-base leading-relaxed;
		}
		:global(button) {
			@apply bg-a-accent text-white brightness-95;
		}
	}
</style>
