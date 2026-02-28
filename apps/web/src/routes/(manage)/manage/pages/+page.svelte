<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import Plus from 'lucide-svelte/icons/plus'

	import AdminScreen from '../AdminScreen.svelte'
	import PageForm from './PageForm.svelte'
	import PageTable from './PageTable.svelte'

	export let data

	let addOpen = false
	let loading = false
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-5" slot="title">
		<div class="text-2xl font-semibold">Pages</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => (addOpen = true)}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Page</Button
		>
	</div>
	<PageTable rows={data.pages} />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<PageForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
