<script lang="ts">
import AdminScreen from '../../AdminScreen.svelte'
import EventForm from './EventForm.svelte'

export let data
</script>

<AdminScreen>
	<div class="grid grid-cols-[50rem_1fr] px-4">
		<div>
			<EventForm users={data.users} event={data.event} titleClass="text-2xl font-semibold" />
		</div>
	</div>
</AdminScreen>
