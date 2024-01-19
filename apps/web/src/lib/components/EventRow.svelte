<script lang="ts">
import type { Event } from '@matterloop/db'

export let event: Event
</script>

<a href="/schedule/{event.id}">
	<div>{event.name}</div>
</a>
