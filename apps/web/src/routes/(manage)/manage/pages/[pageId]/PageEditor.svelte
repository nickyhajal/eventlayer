<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import Button from '$lib/components/ui/button/button.svelte'
import * as Dialog from '$lib/components/ui/dialog'
import Input from '$lib/components/ui/input/input.svelte'
import Label from '$lib/components/ui/label/label.svelte'
import { trpc } from '$lib/trpc/client.js'
import { toast } from 'svelte-sonner'

import type { Page } from '@matterloop/db'
import { kebabCase, tw } from '@matterloop/util'

export let page: Partial<Page> = {
	title: '',
	type: 'building',
	body: '',
}
export let simplified = false
export let inDialog = false
export let titleClass = ''
$: buttonMsg = page?.id ? 'Save Page' : 'Create Page'
$: editing = page?.id ? true : false
$: title = editing ? page?.title : 'Add a Page'
let pageTypes = [{ value: 'basic', label: 'Basic' }]
let pathEdited = (page?.path?.length || 0) > 0
$: page.path = pathEdited && page?.path ? page?.path : kebabCase(page?.title)
// let type = page?.type
// 	? pageTypes.find(({ value }) => value === page?.type)
// 	: { value: 'building', label: 'Building' }
// $: page.type = type.value
let image = ''
let addOpen = false
async function createPage() {
	const res = await trpc().page.upsert.mutate(page)
	if (res) {
		goto(`/manage/pages/${res.id}`)
		toast.success('Page Saved')
	}
}
function pathChange() {
	pathEdited = (page?.path?.length || 0) > 0
}
</script>

<form on:submit={createPage}>
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
				<Label for="page_name" class="text-right">Page Type</Label>
				<Select.Root bind:selected={type}>
					<Select.Trigger class="w-[180px]">
						<Select.Value placeholder="Select Type" />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>Page Type</Select.Label>
							{#each pageTypes as { label, value }}
								<Select.Item value={value} label={label}>{label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
					<Select.Input name="pageType" />
				</Select.Root>
			</div> -->
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="page_name" class="text-right">Page Title</Label>
				<Input id="page_name" bind:value={page.title} class="col-span-3" />
			</div>
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="page_name" class="text-right">Path</Label>
				<Input id="page_name" bind:value={page.path} on:keyup={pathChange} class="col-span-3" />
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
			page={{...page, id: undefined, type: 'basic', title: '', pageId: page.id, body: ''}}
		/>
	</Dialog.Content>
</Dialog.Root>
