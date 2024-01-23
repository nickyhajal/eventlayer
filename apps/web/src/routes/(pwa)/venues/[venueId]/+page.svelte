<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import VenueBlock from '$lib/components/VenueBlock.svelte'
import { getMeContext } from '$lib/state/getContexts'

import type { Event } from '@matterloop/db'
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
		<div class="text-slate-600">{venue.description}</div>
		<!-- {#if event?.venue}
			<div class="mt-8">
				<VenueBlock venue={event.venue} />
			</div>
		{/if} -->
	</div>
</Screen>
