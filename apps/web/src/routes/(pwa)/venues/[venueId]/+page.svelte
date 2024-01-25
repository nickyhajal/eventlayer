<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import VenueBlock from '$lib/components/VenueBlock.svelte'
import { getMeContext } from '$lib/state/getContexts'

import type { Event } from '@matterloop/db'
import Markdown from '@matterloop/ui/src/components/Markdown.svelte'
import { dayjs } from '@matterloop/util'

export let data
$: venue = data.venue
</script>

<Screen
	title={data.venue.name}
	bigTitle={venue.photo ? " " : ""}
	back="/venues"
	photo={venue.photo}
>
	<div class="container mx-auto max-w-7xl py-6">
		<div class="text-base font-semibold text-red-600">
			<!-- {dayjs(data.v.startsAt).format('dddd MMMM Do [at] h:mma')} -->
		</div>
		<div class="pb-3 text-3xl font-bold">{venue.name}</div>
		<div>
			{#if venue.street}
				<div class="text-slate-600">{venue.street}</div>
			{/if}
			{#if venue.city}
				<div class="text-slate-600">{venue.city}, {venue.region} {venue.postalCode}</div>
			{/if}
		</div>
		{#if venue.description}
			<div class="text-slate-600">
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
