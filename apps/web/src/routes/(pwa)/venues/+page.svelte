<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

import { getMediaUrl } from '@matterloop/util'

export let data
$: venues = data.venues
const me = getMeContext()
</script>

<Screen title="Venues" bigTitle="Venues">
	<div class="container mx-auto max-w-7xl">
		<div class="mt-2 grid grid-cols-2 gap-4 py-2">
			{#each venues as venue}
				{#if venue.name}
					<a href="/venues/{venue.id}" class="relative z-0 flex flex-col">
						<div
							class="mb-2 h-32 w-full rounded-lg bg-slate-100 bg-cover bg-center"
							style="background-image: url({getMediaUrl(venue.photo)})"
						></div>
						<div class="truncate text-sm font-semibold">{venue.name}</div>
					</a>
				{/if}
			{/each}
		</div>
	</div>
</Screen>
