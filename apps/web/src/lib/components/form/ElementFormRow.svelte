<script lang="ts">
import { page } from '$app/stores'
import Input from '$lib/components/ui/input/input.svelte'
import Label from '$lib/components/ui/label/label.svelte'
import * as Select from '$lib/components/ui/select'
import { trpc } from '$lib/trpc/client'
import { trpcCaller } from '$lib/util/trpcCaller'
import { check } from 'drizzle-orm/mysql-core'
import { onMount } from 'svelte'
import { toast } from 'svelte-sonner'
import { writable } from 'svelte/store'

import type { FormElement } from '@matterloop/db'
import { IconPopupMenu } from '@matterloop/ui'
import { debounce, dispatch, getId } from '@matterloop/util'

import Switch from '../ui/switch/switch.svelte'

export let element: FormElement
export let index = 0
let saving = false
let lastForm: string
let elementOptions: Option[] = [{ label: '', value: '' }]
export let even: boolean = false
onMount(() => {
	if (element?.id && element?.options) {
		elementOptions = JSON.parse(element.options)
	}
})
let formElm: HTMLFormElement
const form = writable<FormElement>({ ...element, props: element?.props || {} })
const { call, status, enhance } = trpcCaller(trpc($page).formElement.upsert.mutate)
let typeOptions = [
	{ label: 'Title', value: 'title' },
	{ label: 'Markdown Content', value: 'markdown' },
	{ label: 'Text Input', value: 'text' },
	{ label: 'Long Text Input', value: 'textarea' },
	{ label: 'Rich Text Editor', value: 'editor' },
	{ label: 'Single Marker', value: 'marker' },
	{ label: 'Marker Block', value: 'markerBlock' },
	{ label: 'Number Input', value: 'number' },
	{ label: 'Dropdown', value: 'select' },
	{ label: 'Multi Select', value: 'multi' },
]
interface Option {
	label: string
	value: string
}
let type = typeOptions.find((t) => t.value === (element.type || 'text'))
$: $form.type = type?.value || 'text'

async function submitRaw() {
	console.log(lastForm, JSON.stringify($form), lastForm !== JSON.stringify($form))
	if (formElm && lastForm !== JSON.stringify($form)) {
		let shouldSubmit = false
		if (lastForm) shouldSubmit = true
		lastForm = JSON.stringify($form)
		if (!shouldSubmit || saving) return

		saving = true
		console.log('>>> SAVE')
		const res = await call({
			...$form,
		})
		saving = false
		toast.success('Element Saved')
		if (res) {
			if (res.createdAt) {
				form.set({ ...$form, id: res.id, createdAt: res.createdAt })
			}
			$dispatch('elementChange', { id: $form.id })
		}
	}
}
function removeElement() {
	$dispatch('removeElement', { id: $form.id })
}
const save = debounce(submitRaw, 500)
$: element = $form
$: save(), $form
$: {
	if (elementOptions.length) {
		$form.options = JSON.stringify(elementOptions)
	} else {
		$form.options = null
	}
}
</script>

<div class="sticky top-4">
	<form class=" flex w-full flex-col gap-4 px-2" use:enhance bind:this={formElm}>
		<div class={`relative flex flex-col gap-1 rounded-md pb-1`}>
			<div class="relative flex justify-end">
				<IconPopupMenu options={[
						{
							label: 'Delete',
							handleClick: () => {
								removeElement()
							},
						},
					]} />
			</div>
			<div class=" top flex w-full gap-2">
				<div class="w-full">
					<Select.Root bind:selected={type}>
						<Select.Trigger class="w-full bg-white">
							<Select.Value placeholder="Select Type" />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Element Type</Select.Label>
								{#each typeOptions as { label, value }}
									<Select.Item value={value} label={label}>{label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="elementType" />
					</Select.Root>
				</div>
				{#if $form.type === 'title'}
					<div class="w-full flex-grow">
						<Input name="content" placeholder="Title" bind:value={$form.content} />
					</div>
				{/if}
			</div>
			{#if ['select'].includes($form.type)}
				<div class="mt-3 rounded-xl bg-slate-50 p-8 font-medium text-slate-500">
					Coming Soon - Talk to Nicky if this would be useful
				</div>
			{:else if $form.type === 'markdown'}
				<Input type="textarea" placeholder="Content" bind:value={$form.content} />
			{:else if $form.type === 'multi'}
				<div class="flex flex-col">
					<div class="w-1/2">
						<Input name="label" placeholder="Form Label" bind:value={$form.label} />
					</div>
					<div class="mb-1 mt-3 flex flex-col gap-1 text-sm font-semibold text-slate-600">
						Options
					</div>
					<div class="grid grid-cols-1 gap-2">
						{#each elementOptions as option, i}
							<div class="grid grid-cols-2 gap-1">
								<Input placeholder="Option Label" bind:value={elementOptions[i].label} />
								<Input placeholder="Option Value" bind:value={elementOptions[i].value} />
							</div>
						{/each}
					</div>
					<button
						class="mb-6 mt-1 block w-full rounded-lg bg-slate-100 py-2 text-center text-sm text-slate-500"
						on:click|stopPropagation|preventDefault={() =>
							(elementOptions = [...elementOptions, { label: '', value: '' }])}
						>Add Option</button
					>
				</div>
			{:else if $form.type === 'editor'}
				<Input name="label" placeholder="Label" bind:value={$form.label} />
				<Input
					name="content"
					placeholder="Explanation/Additional Info"
					bind:value={$form.content}
				/>
			{:else if $form.type !== 'title'}
				<label for="label">Label</label>
				<Input name="label" placeholder="Form Label" bind:value={$form.label} />
				{#if $form.type === 'number'}
					<Input
						name="label"
						placeholder="Aggregate Key"
						bind:value={$form.key}
						hint="Optional - adds this field to be analyzed by this key"
					/>
				{/if}
			{/if}
			<label for="className">Input HTML Classes</label>
			<Input name="className" placeholder="HTML Classes" bind:value={$form.className} />
			<label for="wrapperClassName">Wrapper HTML Classes</label>
			<Input
				name="wrapperClassName"
				placeholder="Wrapper HTML Classes"
				bind:value={$form.props.rowClass}
			/>
			<label for="userInfoKey">User Info Key</label>
			<Input
				name="userInfoKey"
				placeholder="User Info Key"
				bind:value={$form.userInfoKey}
				hint="Optional - adds this field to be analyzed by this key"
			/>
			<div class="mt-0 flex items-center justify-between">
				<label for="userInfoPublic">Show on Profile</label>
				<Switch name="userInfoPublic" bind:checked={$form.userInfoPublic} class="mt-2" />
			</div>
			<!-- <div class="flex gap-1">
				<Input name="page" type="number" placeholder="Page" bind:value={$form.page} />
				<Input name="group" placeholder="Element Group" type="number" bind:value={$form.group} />
			</div> -->
		</div>
	</form>
</div>

<style lang="postcss">
label {
	@apply -mb-0.5 pt-2 text-sm font-medium text-slate-600;
}
</style>
