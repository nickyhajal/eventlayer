<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import Plus from 'lucide-svelte/icons/plus'

	import AdminScreen from '../AdminScreen.svelte'
	import FormBuilder from './FormBuilder.svelte'
	import FormInfoForm from './FormInfoForm.svelte'
	import FormTable from './FormTable.svelte'

	export let data

	let addOpen = false
	let loading = false
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-5" slot="title">
		<div class="text-2xl font-semibold">Forms</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => (addOpen = true)}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Form</Button
		>
	</div>
	<FormTable rows={data.forms} />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<FormInfoForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
