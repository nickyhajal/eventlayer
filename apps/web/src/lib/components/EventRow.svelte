<script lang="ts">
import ChevronRight from 'lucide-svelte/icons/chevron-right'

import type { Event } from '@matterloop/db'
import { getMediaUrl } from '@matterloop/util'

export let event: Event
</script>

<a
	href="/schedule/{event.id}"
	class="relative z-0 mb-2 grid w-full grid-cols-[5rem_1fr_0.8rem] items-center justify-between gap-2 pb-2"
>
	{#if event.photo || event?.venue?.photo}
		<img
			src={getMediaUrl(event.photo || event?.venue?.photo, 'w=180')}
			class="h-12 w-20 flex-none rounded-md bg-cover object-cover"
		/>
	{:else}
		<div class="h-12 w-20 flex-none rounded-md bg-slate-100"></div>
	{/if}
	<div class="flex flex-none flex-col">
		<div class="-mb-0.5 line-clamp-1 w-full text-[0.92rem] font-semibold text-slate-800">
			{event.name}
		</div>
		{#if event.venue}
			<div class="line-clamp-1 text-[0.86rem] text-slate-600">{event.venue.name}</div>
		{/if}
	</div>
	<ChevronRight class="h-5 w-5 flex-none self-center text-slate-400" />
</a>
