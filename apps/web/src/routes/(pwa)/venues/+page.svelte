<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

import { getMediaUrl } from '@matterloop/util'

export let data
$: venues = data.venues
const me = getMeContext()
</script>

<Screen title="Venues" bigTitle="Venues" bodyClass="bg-slate-100">
	<div class="container mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-2 grid grid-cols-2 gap-3 py-2">
			{#each venues as venue}
				{#if venue.name}
					<a href="/venues/{venue.id}" class="relative z-0 flex flex-col rounded-2xl bg-white p-1">
						<div
							class="mb-2 h-48 w-full rounded-lg bg-slate-100 bg-cover bg-center"
							style="background-image: url({getMediaUrl(venue.photo)})"
						></div>
						<div class="px-2 pb-1">
							<div class="truncate text-sm font-semibold">{venue.name}</div>
						</div>
					</a>
				{/if}
			{/each}
		</div>
	</div>
</Screen>
