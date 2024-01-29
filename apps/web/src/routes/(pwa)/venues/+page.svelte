<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getMeContext } from '$lib/state/getContexts'
import ChevronRight from 'lucide-svelte/icons/chevron-right'

import { getMediaUrl } from '@matterloop/util'

export let data
$: venues = data.venues
const me = getMeContext()
</script>

<Screen title="Venues" bigTitle="Venues" bodyClass="bg-slate-100">
	<div
		class="topNav sticky top-12 z-40 flex items-center justify-center border-b border-slate-300/50 bg-slate-50 px-4 py-2 text-center text-sm text-slate-600"
	>
		<Button
			variant="outline"
			class="text-main mt-0 grid w-full grid-cols-[1fr_0.7rem] items-center justify-center bg-white"
			href="/venues/map"
		>
			<div>View Venue Map</div>
			<ChevronRight class="text-main relative -top-[1px] h-5 w-5" />
		</Button>
	</div>
	<div class="container relative mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-2 grid grid-cols-1 gap-3 py-2 md:grid-cols-2">
			{#each venues as venue}
				{#if venue.name}
					<a
						href="/venues/{venue.id}"
						class="relative z-0 flex flex-col rounded-2xl border-b-2 border-slate-200/70 bg-white p-1"
					>
						<div
							class="mb-2 h-64 w-full rounded-xl bg-slate-100 bg-cover bg-center"
							style="background-image: url({getMediaUrl(venue.photo)})"
						></div>
						<div class="px-2 py-1 pb-2">
							<div class="truncate text-base font-semibold text-slate-700">{venue.name}</div>
						</div>
					</a>
				{/if}
			{/each}
		</div>
	</div>
</Screen>

<style lang="postcss">
.topNav {
	/* top: 3rem; */
	top: calc((env(safe-area-inset-top) * 0.885) + 3rem);
}
</style>
