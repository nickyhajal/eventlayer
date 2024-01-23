<script lang="ts">
import EventForm from './EventForm.svelte'

export let data
</script>

<div class="grid grid-cols-[50rem_1fr] px-4">
	<div>
		<EventForm event={data.event} titleClass="text-2xl font-semibold" />
	</div>
</div>
