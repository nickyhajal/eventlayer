<script lang="ts">
	import { page } from '$app/stores'
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
	import Input from './Input.svelte'

	export let element: FormElement
	export let index = 0
	let saving = false
	let lastSavedForm: string
	let elementOptions: Option[] =
		element?.id && element?.options ? JSON.parse(element.options) : [{ label: '', value: '' }]
	export let even: boolean = false
	let formElm: HTMLFormElement
	const form = writable<FormElement>({ ...element, props: element?.props || {} })
	let lastForm = JSON.stringify($form)
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
		{ label: 'Avatar Upload', value: 'avatar' },
	]
	interface Option {
		label: string
		value: string
	}
	let type = typeOptions.find((t) => t.value === (element.type || 'text'))
	$: $form.type = type?.value || 'text'

	async function submitRaw() {
		if (formElm && lastSavedForm !== JSON.stringify($form)) {
			let shouldSubmit = false
			if (lastSavedForm) shouldSubmit = true
			lastSavedForm = JSON.stringify($form)
			if (!shouldSubmit || saving) return

			saving = true
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
	const save = debounce(submitRaw, 900)
	$: if (lastForm !== JSON.stringify($form)) {
		element = $form
		lastForm = JSON.stringify($form)
	}
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
				<IconPopupMenu
					options={[
						{
							label: 'Delete',
							handleClick: () => {
								removeElement()
							},
						},
					]}
				/>
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
									<Select.Item {value} {label}>{label}</Select.Item>
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
			{#if $form.type === 'markdown'}
				<Input type="textarea" placeholder="Content" bind:value={$form.content} />
			{:else if $form.type === 'multi' || $form.type === 'select'}
				<div class="flex flex-col">
					<div class="w-full">
						<label for="label">Label</label>
						<Input name="label" placeholder="Form Label" bind:value={$form.label} />
					</div>
					{#if $form.type === 'select'}
						<div class="w-full">
							<label for="placeholder">Select Placeholder</label>
							<Input
								name="placeholder"
								placeholder="Form Placeholder"
								bind:value={$form.placeholder}
							/>
						</div>
					{/if}
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
						class="mb-6 mt-1 block w-full rounded-md bg-slate-700 py-1 text-center text-sm text-slate-100"
						on:click|stopPropagation|preventDefault={() =>
							(elementOptions = [...elementOptions, { label: '', value: '' }])}>Add Option</button
					>
					{#if $form.type === 'multi'}
						<div class="w-full">
							<label for="maxSelected">Max Selections</label>
							<Input
								name="maxSelected"
								type="select"
								options={[
									{ label: 'No max', value: -1 },
									...Array(elementOptions.length)
										.fill(0)
										.map((_, i) => ({ label: `${i + 1}`, value: i + 1 })),
								]}
								bind:value={$form.props.maxSelected}
							/>
						</div>
					{/if}
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
			<label for="info">Info</label>
			<Input name="info" placeholder="Info" bind:value={$form.info} />
			<label for="hint">Hint</label>
			<Input name="hint" placeholder="Input Hint" bind:value={$form.hint} />
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
			<div class="mt-6 flex gap-1 border-t border-slate-200 pt-3">
				<div>
					<label for="page">Page</label>
					<Input name="page" type="number" placeholder="Page" bind:value={$form.page} />
				</div>
				<!-- <Input name="group" placeholder="Element Group" type="number" bind:value={$form.group} /> -->
			</div>
		</div>
	</form>
</div>

<style lang="postcss">
	label {
		@apply -mb-0.5 pt-2 text-sm font-medium text-slate-600;
	}
</style>
