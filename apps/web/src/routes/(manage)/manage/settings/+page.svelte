<script lang="ts">
import { getEventContext } from '$lib/state/getContexts'

import AdminScreen from '../AdminScreen.svelte'
import EventForm from './MainEventForm.svelte'

export let data
const event = getEventContext()
</script>

{#if $event?.id}
	<AdminScreen title={$event.name}>
		<EventForm event={$event} showTitle={false} />
	</AdminScreen>
{/if}
