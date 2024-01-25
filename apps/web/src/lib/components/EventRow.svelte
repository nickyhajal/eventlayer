<script lang="ts">
import ChevronRight from 'lucide-svelte/icons/chevron-right'

import type { Event } from '@matterloop/db'
import { getMediaUrl } from '@matterloop/util'

export let event: Event
</script>

<a
	href="/schedule/{event.id}"
	class="relative z-0 mb-2 flex w-full items-center justify-between gap-2 border-b border-slate-100 py-3"
>
	<div class="flex gap-2">
		{#if event.photo || event?.venue?.photo}
			<img
				src={getMediaUrl(event.photo || event?.venue?.photo)}
				class="h-16 w-24 rounded-md bg-cover object-cover"
			/>
		{:else}
			<div class="h-16 w-24 rounded-md bg-slate-50/0"></div>
		{/if}
		<div class="flex flex-col">
			<div class="w-11/12 truncate text-[0.95rem] font-semibold text-slate-800">{event.name}</div>
			{#if event.venue}
				<div class="truncate text-[0.95rem] text-slate-600">{event.venue.name}</div>
			{/if}
		</div>
	</div>
	<ChevronRight class="h-5 w-5 self-center text-slate-400" />
</a>
