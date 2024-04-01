<script lang="ts">
import EventForm from './MainEventForm.svelte'

export let data
</script>

<div class="">
	<EventForm event={data.event} />
</div>
