<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Dialog from '$lib/components/ui/dialog'
import ListOrdered from 'lucide-svelte/icons/list-ordered'
import Plus from 'lucide-svelte/icons/plus'

import AdminScreen from '../AdminScreen.svelte'
import SponsorForm from './SponsorForm.svelte'
import SponsorTable from './SponsorTable.svelte'

export let data

let addOpen = false
let loading = false
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-3" slot="title">
		<div class="text-2xl font-semibold">Sponsors</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => addOpen = true}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Sponsor</Button
		>
		<Button href="/manage/sponsors/order" variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3">
			<ListOrdered class="mr-2 w-[1rem] text-slate-700" />
			Set Order</Button
		>
	</div>
	<SponsorTable rows={data.sponsors} />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<SponsorForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
