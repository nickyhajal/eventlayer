<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import Button from '$lib/components/ui/button/button.svelte'
import * as Dialog from '$lib/components/ui/dialog'
import Input from '$lib/components/ui/input/input.svelte'
import Label from '$lib/components/ui/label/label.svelte'
import * as Select from '$lib/components/ui/select'
import Textarea from '$lib/components/ui/textarea/textarea.svelte'
import Uploader from '$lib/components/ui/Uploader.svelte'
import { trpc } from '$lib/trpc/client.js'
import { getMediaUrl } from '$lib/util/getMediaUrl'
import { Upload } from 'radix-icons-svelte'
// import toast from 'svelte-french-toast'
import { toast } from 'svelte-sonner'

import type { Form } from '@matterloop/db'
import { tw } from '@matterloop/util'

export let form: Partial<Form> = {
	name: '',
	type: 'building',
	description: '',
}
export let simplified = false
export let inDialog = false
export let titleClass = ''
$: buttonMsg = form?.id ? 'Save Form' : 'Create Form'
$: editing = form?.id ? true : false
$: title = editing ? form?.name : 'Add a Form'
let formTypes = [
	{ value: 'building', label: 'Building' },
	{ value: 'room', label: 'Room' },
]
// let type = form?.type
// 	? formTypes.find(({ value }) => value === form?.type)
// 	: { value: 'building', label: 'Building' }
// $: form.type = type.value
let image = ''
let addOpen = false
async function createForm() {
	const res = await trpc().form.upsert.mutate(form)
	goto(`/manage/forms/${res.id}`)
	toast.success('Form Saved')
}
// async function updateAvatar(mediaId: string) {
// 	trpc().form.upsert.mutate({ id: form.id, mediaId })
// 	invalidateAll()
// }
</script>

<form on:submit={createForm}>
	{#if inDialog}
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
		</Dialog.Header>
	{:else}
		<div class={tw(`mb-2 mt-0 text-lg font-semibold ${titleClass}`)}>{title}</div>
	{/if}
	<div class="grid grid-cols-1 gap-8">
		<div class="grid gap-4 py-4">
			<!-- <div class="flex flex-col items-start justify-center gap-1">
				<Label for="form_name" class="text-right">Form Type</Label>
				<Select.Root bind:selected={type}>
					<Select.Trigger class="w-[180px]">
						<Select.Value placeholder="Select Type" />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Form Type</Select.Label>
							{#each formTypes as { label, value }}
								<Select.Item value={value} label={label}>{label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
					<Select.Input name="formType" />
				</Select.Root>
			</div> -->
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="form_name" class="text-right">Form Name</Label>
				<Input id="form_name" bind:value={form.name} class="col-span-3" />
			</div>
			<div class="flex justify-end"><Button type="submit">{buttonMsg}</Button></div>
		</div>
	</div>
</form>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<svelte:self
			simplified={true}
			inDialog={true}
			form={{...form, id: undefined, type: 'room', name: '', mediaId: undefined, formId: form.id, description: ''}}
		/>
	</Dialog.Content>
</Dialog.Root>
