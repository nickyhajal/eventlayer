<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import VenueBlock from '$lib/components/VenueBlock.svelte'
import { getMeContext } from '$lib/state/getContexts'

import type { Event } from '@matterloop/db'
import Markdown from '@matterloop/ui/src/components/Markdown.svelte'
import { dayjs } from '@matterloop/util'

export let data
$: event = data.event
</script>

<Screen
	title={data.event.name}
	bigTitle={event.photo ? " " : ""}
	back="/schedule"
	photo={event.photo}
>
	<div class="container mx-auto max-w-7xl py-6">
		<div class="text-base font-semibold text-red-600">
			{dayjs(data.event.startsAt).format('dddd MMMM Do [at] h:mma')}
		</div>
		<div class="pb-3 text-3xl font-bold">{event.name}</div>
		{#if event.subtitle}
			<div class="-mt-2 pb-3 pr-6 text-base font-semibold leading-snug text-slate-600">
				{event.subtitle}
			</div>
		{/if}
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
	</div>
</Screen>
