<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import Button from '$lib/components/ui/button/button.svelte'
	import * as Dialog from '$lib/components/ui/dialog'
	import Input from '$lib/components/ui/input/input.svelte'
	import Label from '$lib/components/ui/label/label.svelte'
	import { trpc } from '$lib/trpc/client.js'
	import Check from 'lucide-svelte/icons/check'
	import Copy from 'lucide-svelte/icons/copy'
	import KeyRound from 'lucide-svelte/icons/key-round'
	import Plus from 'lucide-svelte/icons/plus'
	import Trash2 from 'lucide-svelte/icons/trash-2'
	import { toast } from 'svelte-sonner'

	import { dayjs } from '@matterloop/util'

	interface ApiKeyDisplay {
		id: string
		name: string
		keyPrefix: string
		lastUsedAt: string | null
		createdAt: string | null
	}

	export let apiKeys: ApiKeyDisplay[] = []

	let createDialogOpen = false
	let newKeyDialogOpen = false
	let newKeyName = ''
	let newlyCreatedKey = ''
	let copied = false
	let creating = false

	async function createApiKey() {
		if (!newKeyName.trim()) {
			toast.error('Please enter a name for the API key')
			return
		}

		creating = true
		try {
			const result = await trpc().apiKey.create.mutate({ name: newKeyName.trim() })
			newlyCreatedKey = result.apiKey
			createDialogOpen = false
			newKeyDialogOpen = true
			newKeyName = ''
			await invalidateAll()
		} catch (e) {
			toast.error('Failed to create API key')
		} finally {
			creating = false
		}
	}

	async function revokeApiKey(id: string, name: string) {
		if (!confirm(`Are you sure you want to revoke the API key "${name}"? This cannot be undone.`)) {
			return
		}

		try {
			await trpc().apiKey.revoke.mutate({ id })
			toast.success('API key revoked')
			await invalidateAll()
		} catch (e) {
			toast.error('Failed to revoke API key')
		}
	}

	async function copyToClipboard() {
		await navigator.clipboard.writeText(newlyCreatedKey)
		copied = true
		toast.success('API key copied to clipboard')
		setTimeout(() => {
			copied = false
		}, 2000)
	}

	function formatDate(date: string | null) {
		if (!date) return 'Never'
		return dayjs(date).format('MMM D, YYYY h:mm A')
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-stone-800">API Keys</h2>
		<p class="mt-1 text-sm text-stone-500">
			API keys allow external applications to access your event data via the REST API.
		</p>
	</div>

	<!-- API Keys List -->
	<div class="rounded-lg border border-stone-200">
		{#if apiKeys.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<KeyRound class="h-12 w-12 text-stone-300" />
				<p class="mt-3 text-sm font-medium text-stone-600">No API keys yet</p>
				<p class="mt-1 text-sm text-stone-500">Create an API key to access your event data.</p>
			</div>
		{:else}
			<div class="divide-y divide-stone-100">
				{#each apiKeys as key}
					<div class="flex items-center justify-between px-4 py-3">
						<div class="flex-1">
							<div class="font-medium text-stone-800">{key.name}</div>
							<div class="mt-0.5 flex items-center gap-3 text-sm text-stone-500">
								<code class="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs"
									>{key.keyPrefix}</code
								>
								<span>Created {formatDate(key.createdAt)}</span>
								{#if key.lastUsedAt}
									<span>·</span>
									<span>Last used {formatDate(key.lastUsedAt)}</span>
								{/if}
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							class="text-red-600 hover:bg-red-50 hover:text-red-700"
							on:click={() => revokeApiKey(key.id, key.name)}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Create Button -->
	<Button on:click={() => (createDialogOpen = true)}>
		<Plus class="mr-2 h-4 w-4" />
		Create API Key
	</Button>

	<!-- Create Dialog -->
	<Dialog.Root bind:open={createDialogOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Create API Key</Dialog.Title>
				<Dialog.Description>
					Give your API key a descriptive name so you can identify it later.
				</Dialog.Description>
			</Dialog.Header>
			<form on:submit|preventDefault={createApiKey}>
				<div class="grid gap-4 py-4">
					<div class="flex flex-col gap-2">
						<Label for="keyName">Name</Label>
						<Input
							id="keyName"
							bind:value={newKeyName}
							placeholder="e.g., Marketing Website"
							autofocus
						/>
					</div>
				</div>
				<Dialog.Footer>
					<Button variant="outline" on:click={() => (createDialogOpen = false)}>Cancel</Button>
					<Button type="submit" disabled={creating}>
						{creating ? 'Creating...' : 'Create Key'}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<!-- New Key Display Dialog -->
	<Dialog.Root bind:open={newKeyDialogOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>API Key Created</Dialog.Title>
				<Dialog.Description>
					<span class="font-semibold text-amber-600">
						Make sure to copy your API key now. You won't be able to see it again!
					</span>
				</Dialog.Description>
			</Dialog.Header>
			<div class="py-4">
				<div class="flex items-center gap-2">
					<code
						class="flex-1 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm"
					>
						{newlyCreatedKey}
					</code>
					<Button variant="outline" size="icon" on:click={copyToClipboard}>
						{#if copied}
							<Check class="h-4 w-4 text-green-600" />
						{:else}
							<Copy class="h-4 w-4" />
						{/if}
					</Button>
				</div>
				<div class="mt-4 rounded-md bg-stone-100 p-3 text-sm text-stone-600">
					<p class="font-medium">Usage Example:</p>
					<code class="mt-2 block whitespace-pre-wrap break-all font-mono text-xs">
						curl -H "Authorization: Bearer {newlyCreatedKey}" \
						https://yourevent.eventlayer.io/rest/pages
					</code>
				</div>
			</div>
			<Dialog.Footer>
				<Button on:click={() => (newKeyDialogOpen = false)}>Done</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
