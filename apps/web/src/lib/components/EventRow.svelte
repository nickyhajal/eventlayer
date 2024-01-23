<script lang="ts">
import type { Event } from '@matterloop/db'

export let event: Event
</script>

<a href="/schedule/{event.id}" class="relative z-0 mb-2 flex border-b border-slate-100 py-3">
	<div class="truncate text-sm font-semibold">{event.name}</div>
</a>
