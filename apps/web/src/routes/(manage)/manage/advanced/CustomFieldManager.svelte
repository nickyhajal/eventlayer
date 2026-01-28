<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import Button from '$lib/components/ui/button/button.svelte'
	import * as Dialog from '$lib/components/ui/dialog'
	import Input from '$lib/components/ui/input/input.svelte'
	import Label from '$lib/components/ui/label/label.svelte'
	import * as Select from '$lib/components/ui/select'
	import { trpc } from '$lib/trpc/client.js'
	import GripVertical from 'lucide-svelte/icons/grip-vertical'
	import Pencil from 'lucide-svelte/icons/pencil'
	import Plus from 'lucide-svelte/icons/plus'
	import TextCursorInput from 'lucide-svelte/icons/text-cursor-input'
	import Trash2 from 'lucide-svelte/icons/trash-2'
	import { toast } from 'svelte-sonner'

	import type { EventUserField } from '@matterloop/db'

	export let customFields: EventUserField[] = []

	let createDialogOpen = false
	let editDialogOpen = false
	let creating = false
	let updating = false

	// Form state
	let editingField: EventUserField | null = null
	let fieldLabel = ''
	let fieldType: { value: string; label: string } = { value: 'text', label: 'Short Text' }
	let fieldScope: { value: string; label: string } = { value: 'all', label: 'All Users' }
	let fieldScopeValue = ''
	let fieldVisibility: { value: string; label: string } = { value: 'admin', label: 'Admin Only' }
	let fieldOptions = ''

	const fieldTypes = [
		{ value: 'text', label: 'Short Text' },
		{ value: 'textarea', label: 'Long Text' },
		{ value: 'boolean', label: 'Yes/No Switch' },
		{ value: 'options', label: 'Options' },
	]

	const fieldScopes = [
		{ value: 'all', label: 'All Users' },
		{ value: 'user', label: 'Specific User' },
		{ value: 'type', label: 'User Type' },
	]

	// TODO: Make this configurable per event
	const userTypes = [
		{ value: 'attendee', label: 'Attendee' },
		{ value: 'speaker', label: 'Speaker' },
		{ value: 'ambassador', label: 'Ambassador' },
		{ value: 'staff', label: 'Staff' },
		{ value: 'sponsor', label: 'Sponsor' },
	]

	const visibilityOptions = [
		{ value: 'admin', label: 'Admin Only' },
		// TODO: Implement attendee-editable fields in PWA profile edit
		{ value: 'attendee', label: 'Attendee Editable (coming soon)', disabled: true },
		{ value: 'public', label: 'Public (visible in REST API)' },
	]

	function resetForm() {
		fieldLabel = ''
		fieldType = { value: 'text', label: 'Short Text' }
		fieldScope = { value: 'all', label: 'All Users' }
		fieldScopeValue = ''
		fieldVisibility = { value: 'admin', label: 'Admin Only' }
		fieldOptions = ''
		editingField = null
	}

	function openCreateDialog() {
		resetForm()
		createDialogOpen = true
	}

	function openEditDialog(field: EventUserField) {
		editingField = field
		fieldLabel = field.label
		fieldType = fieldTypes.find((t) => t.value === field.fieldType) || fieldTypes[0]
		fieldScope = fieldScopes.find((s) => s.value === field.scope) || fieldScopes[0]
		fieldScopeValue = field.scopeValue || ''
		fieldVisibility =
			visibilityOptions.find((v) => v.value === field.visibility) || visibilityOptions[0]
		fieldOptions = field.options || ''
		editDialogOpen = true
	}

	async function createField() {
		if (!fieldLabel.trim()) {
			toast.error('Please enter a field label')
			return
		}

		creating = true
		try {
			await trpc().eventUserField.create.mutate({
				label: fieldLabel.trim(),
				fieldType: fieldType.value as 'text' | 'textarea' | 'boolean' | 'options',
				scope: fieldScope.value as 'all' | 'user' | 'type',
				scopeValue: fieldScope.value !== 'all' ? fieldScopeValue : undefined,
				visibility: fieldVisibility.value as 'admin' | 'attendee' | 'public',
				options: fieldType.value === 'options' ? fieldOptions : undefined,
			})
			createDialogOpen = false
			resetForm()
			toast.success('Custom field created')
			await invalidateAll()
		} catch (e) {
			toast.error('Failed to create custom field')
		} finally {
			creating = false
		}
	}

	async function updateField() {
		if (!editingField || !fieldLabel.trim()) {
			toast.error('Please enter a field label')
			return
		}

		updating = true
		try {
			await trpc().eventUserField.update.mutate({
				id: editingField.id,
				label: fieldLabel.trim(),
				fieldType: fieldType.value as 'text' | 'textarea' | 'boolean' | 'options',
				scope: fieldScope.value as 'all' | 'user' | 'type',
				scopeValue: fieldScope.value !== 'all' ? fieldScopeValue : undefined,
				visibility: fieldVisibility.value as 'admin' | 'attendee' | 'public',
				options: fieldType.value === 'options' ? fieldOptions : undefined,
			})
			editDialogOpen = false
			resetForm()
			toast.success('Custom field updated')
			await invalidateAll()
		} catch (e) {
			toast.error('Failed to update custom field')
		} finally {
			updating = false
		}
	}

	async function deleteField(id: string, label: string) {
		if (!confirm(`Are you sure you want to delete the field "${label}"? This cannot be undone.`)) {
			return
		}

		try {
			await trpc().eventUserField.delete.mutate({ id })
			toast.success('Custom field deleted')
			await invalidateAll()
		} catch (e) {
			toast.error('Failed to delete custom field')
		}
	}

	function getFieldTypeLabel(type: string | null) {
		return fieldTypes.find((t) => t.value === type)?.label || 'Short Text'
	}

	function getScopeLabel(field: EventUserField) {
		if (field.scope === 'all') return 'All Users'
		if (field.scope === 'user') return `User: ${field.scopeValue}`
		if (field.scope === 'type') {
			const userType = userTypes.find((t) => t.value === field.scopeValue)
			return `Type: ${userType?.label || field.scopeValue}`
		}
		return 'All Users'
	}

	function getVisibilityLabel(visibility: string | null) {
		return visibilityOptions.find((v) => v.value === visibility)?.label || 'Admin Only'
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-stone-800">Custom User Fields</h2>
		<p class="mt-1 text-sm text-stone-500">
			Define custom fields that appear on user profiles. Values are stored per user.
		</p>
	</div>

	<!-- Custom Fields List -->
	<div class="rounded-lg border border-stone-200">
		{#if customFields.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<TextCursorInput class="h-12 w-12 text-stone-300" />
				<p class="mt-3 text-sm font-medium text-stone-600">No custom fields yet</p>
				<p class="mt-1 text-sm text-stone-500">
					Create custom fields to collect additional user information.
				</p>
			</div>
		{:else}
			<div class="divide-y divide-stone-100">
				{#each customFields as field}
					<div class="flex items-center justify-between px-4 py-3">
						<div class="flex items-center gap-3">
							<GripVertical class="h-4 w-4 cursor-grab text-stone-400" />
							<div>
								<div class="font-medium text-stone-800">{field.label}</div>
								<div class="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
									<span
										class="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.65rem] uppercase"
									>
										{getFieldTypeLabel(field.fieldType)}
									</span>
									<span>·</span>
									<span>{getScopeLabel(field)}</span>
									<span>·</span>
									<span>{getVisibilityLabel(field.visibility)}</span>
								</div>
							</div>
						</div>
						<div class="flex items-center gap-1">
							<Button variant="ghost" size="sm" on:click={() => openEditDialog(field)}>
								<Pencil class="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="text-red-600 hover:bg-red-50 hover:text-red-700"
								on:click={() => deleteField(field.id, field.label)}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Create Button -->
	<Button on:click={openCreateDialog}>
		<Plus class="mr-2 h-4 w-4" />
		Add Custom Field
	</Button>

	<!-- Create Dialog -->
	<Dialog.Root bind:open={createDialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Add Custom Field</Dialog.Title>
				<Dialog.Description>
					Define a new custom field for user profiles.
				</Dialog.Description>
			</Dialog.Header>
			<form on:submit|preventDefault={createField}>
				<div class="grid gap-4 py-4">
					<div class="flex flex-col gap-2">
						<Label for="fieldLabel">Field Label</Label>
						<Input
							id="fieldLabel"
							bind:value={fieldLabel}
							placeholder="e.g., Dietary Restrictions"
							autofocus
						/>
					</div>

					<div class="flex flex-col gap-2">
						<Label>Field Type</Label>
						<Select.Root bind:selected={fieldType}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select type" />
							</Select.Trigger>
							<Select.Content>
								{#each fieldTypes as type}
									<Select.Item value={type.value} label={type.label}>{type.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if fieldType.value === 'options'}
						<div class="flex flex-col gap-2">
							<Label for="fieldOptions">Options (comma-separated)</Label>
							<Input
								id="fieldOptions"
								bind:value={fieldOptions}
								placeholder="e.g., Option 1, Option 2, Option 3"
							/>
						</div>
					{/if}

					<div class="flex flex-col gap-2">
						<Label>Field For</Label>
						<Select.Root bind:selected={fieldScope}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select scope" />
							</Select.Trigger>
							<Select.Content>
								{#each fieldScopes as scope}
									<Select.Item value={scope.value} label={scope.label}>{scope.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if fieldScope.value === 'type'}
						<div class="flex flex-col gap-2">
							<Label>User Type</Label>
							<Select.Root
								selected={userTypes.find((t) => t.value === fieldScopeValue) || undefined}
								onSelectedChange={(v) => (fieldScopeValue = v?.value || '')}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="Select user type" />
								</Select.Trigger>
								<Select.Content>
									{#each userTypes as type}
										<Select.Item value={type.value} label={type.label}>{type.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{/if}

					{#if fieldScope.value === 'user'}
						<div class="flex flex-col gap-2">
							<Label for="scopeUserId">User ID</Label>
							<Input id="scopeUserId" bind:value={fieldScopeValue} placeholder="User UUID" />
						</div>
					{/if}

					<div class="flex flex-col gap-2">
						<Label>Visibility</Label>
						<Select.Root bind:selected={fieldVisibility}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select visibility" />
							</Select.Trigger>
							<Select.Content>
								{#each visibilityOptions as option}
									<Select.Item
										value={option.value}
										label={option.label}
										disabled={option.disabled}
									>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" on:click={() => (createDialogOpen = false)}>Cancel</Button>
					<Button type="submit" disabled={creating}>
						{creating ? 'Creating...' : 'Create Field'}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Edit Dialog -->
	<Dialog.Root bind:open={editDialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Edit Custom Field</Dialog.Title>
				<Dialog.Description>
					Update the custom field settings.
				</Dialog.Description>
			</Dialog.Header>
			<form on:submit|preventDefault={updateField}>
				<div class="grid gap-4 py-4">
					<div class="flex flex-col gap-2">
						<Label for="editFieldLabel">Field Label</Label>
						<Input id="editFieldLabel" bind:value={fieldLabel} />
					</div>

					<div class="flex flex-col gap-2">
						<Label>Field Type</Label>
						<Select.Root bind:selected={fieldType}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select type" />
							</Select.Trigger>
							<Select.Content>
								{#each fieldTypes as type}
									<Select.Item value={type.value} label={type.label}>{type.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if fieldType.value === 'options'}
						<div class="flex flex-col gap-2">
							<Label for="editFieldOptions">Options (comma-separated)</Label>
							<Input id="editFieldOptions" bind:value={fieldOptions} />
						</div>
					{/if}

					<div class="flex flex-col gap-2">
						<Label>Field For</Label>
						<Select.Root bind:selected={fieldScope}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select scope" />
							</Select.Trigger>
							<Select.Content>
								{#each fieldScopes as scope}
									<Select.Item value={scope.value} label={scope.label}>{scope.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					{#if fieldScope.value === 'type'}
						<div class="flex flex-col gap-2">
							<Label>User Type</Label>
							<Select.Root
								selected={userTypes.find((t) => t.value === fieldScopeValue) || undefined}
								onSelectedChange={(v) => (fieldScopeValue = v?.value || '')}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="Select user type" />
								</Select.Trigger>
								<Select.Content>
									{#each userTypes as type}
										<Select.Item value={type.value} label={type.label}>{type.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{/if}

					{#if fieldScope.value === 'user'}
						<div class="flex flex-col gap-2">
							<Label for="editScopeUserId">User ID</Label>
							<Input id="editScopeUserId" bind:value={fieldScopeValue} placeholder="User UUID" />
						</div>
					{/if}

					<div class="flex flex-col gap-2">
						<Label>Visibility</Label>
						<Select.Root bind:selected={fieldVisibility}>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select visibility" />
							</Select.Trigger>
							<Select.Content>
								{#each visibilityOptions as option}
									<Select.Item
										value={option.value}
										label={option.label}
										disabled={option.disabled}
									>
										{option.label}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" on:click={() => (editDialogOpen = false)}>Cancel</Button>
					<Button type="submit" disabled={updating}>
						{updating ? 'Saving...' : 'Save Changes'}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
</div>
