<script lang="ts">
import AdminScreen from '../AdminScreen.svelte'
import EventForm from './MainEventForm.svelte'

export let data
</script>

<AdminScreen>
	<div class="">
		<EventForm event={data.event} />
	</div>
</AdminScreen>
