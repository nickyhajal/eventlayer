<script lang="ts">
import ChevronRight from 'lucide-svelte/icons/chevron-right'

import type { Venue } from '@matterloop/db'

import Button from './ui/button/button.svelte'

export let venue: Venue
</script>

<div
	variant="ghost"
	class="block h-fit w-full items-start justify-start rounded-lg border px-2 py-1.5 text-left"
>
	<div class="mb-1 text-sm font-medium text-red-500">Venue</div>
	<Button
		variant="ghost"
		href="/venues/{venue.id}"
		class="flex h-fit w-full items-center justify-between gap-2 rounded-lg bg-slate-100 px-4 py-3 text-left hover:bg-slate-200"
	>
		<div>
			<div class="text-xl font-semibold">{venue.name}</div>
			<div class="text-slate-600">{venue.description}</div>
			<div class="text-slate-600">{venue.street}</div>
			<div class="text-slate-600">{venue.city}, {venue.region} {venue.postalCode}</div>
		</div>
		<div>
			<ChevronRight class="h-6 w-6 text-slate-600" />
		</div></Button
	>
</div>
