<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Dialog from '$lib/components/ui/dialog'
import ListOrdered from 'lucide-svelte/icons/list-ordered'
import Map from 'lucide-svelte/icons/map'
import Plus from 'lucide-svelte/icons/plus'

import AdminScreen from '../AdminScreen.svelte'
import VenueForm from './VenueForm.svelte'
import VenueTable from './VenueTable.svelte'

export let data

let addOpen = false
let loading = false
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-5" slot="title">
		<div class="text-2xl font-semibold">Venues</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => addOpen = true}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Venue</Button
		>
		<Button href="/manage/venues/order" variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3">
			<ListOrdered class="mr-2 w-[1rem] text-slate-700" />
			Set Order</Button
		>
		<Button href="/manage/venues/maps" variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3">
			<Map class="mr-2 w-[1rem] text-slate-700" />
			Venue Maps</Button
		>
	</div>
	<VenueTable rows={data.venues} />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<VenueForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
