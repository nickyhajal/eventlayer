<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import VenueBlock from '$lib/components/VenueBlock.svelte'
import { getMeContext } from '$lib/state/getContexts'
import Map from 'lucide-svelte/icons/map'

import type { Event } from '@matterloop/db'
import Markdown from '@matterloop/ui/src/components/Markdown.svelte'
import { dayjs } from '@matterloop/util'

export let data
$: venue = data.venue
$: fullAddress = `${venue.street}, ${venue.city}, ${venue.region} ${venue.postalCode}`
</script>

<Screen
	title={data.venue.name}
	bigTitle={venue.photo ? " " : ""}
	back="/venues"
	photo={venue.photo}
>
	<div class="mx-auto max-w-7xl px-4 py-6">
		<div class="text-base font-semibold text-red-600">
			<!-- {dayjs(data.v.startsAt).format('dddd MMMM Do [at] h:mma')} -->
		</div>
		<div class="pb-3 text-3xl font-bold">{venue.name}</div>
		<Button
			variant="outline"
			class="mb-4 flex h-fit items-start justify-between text-left"
			href="https://www.google.com/maps/dir/?api=1&origin=My+Location&destination={encodeURIComponent(fullAddress)}"
		>
			<div class="flex flex-col">
				{#if venue.street}
					<div class="text-slate-600">{venue.street}</div>
				{/if}
				{#if venue.city}
					<div class="text-slate-600">{venue.city}, {venue.region} {venue.postalCode}</div>
				{/if}
			</div>
			<div class="flex flex-col items-center justify-center">
				<Map class="h-6 w-6 text-slate-700" />
				<div class="text-xs text-slate-600">Directions</div>
			</div>
		</Button>
		{#if venue.description}
			<div class="p-2 text-slate-600">
				<Markdown data={venue.description} />
			</div>
		{/if}
		<!-- {#if event?.venue}
			<div class="mt-8">
				<VenueBlock venue={event.venue} />
			</div>
		{/if} -->
	</div>
</Screen>
