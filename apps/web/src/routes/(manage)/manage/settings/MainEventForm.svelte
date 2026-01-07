<script lang="ts">
	import { goto, invalidate, invalidateAll } from '$app/navigation'
	import AttendeeSearchInput from '$lib/components/AttendeeSearchInput.svelte'
	import SelectVenue from '$lib/components/SelectVenue.svelte'
	import { Button } from '$lib/components/ui/button'
	import DatetimePicker from '$lib/components/ui/DatetimePicker.svelte'
	import * as Dialog from '$lib/components/ui/dialog'
	import { Input } from '$lib/components/ui/input'
	import Label from '$lib/components/ui/label/label.svelte'
	import * as Select from '$lib/components/ui/select'
	import { Textarea } from '$lib/components/ui/textarea'
	import Uploader from '$lib/components/ui/Uploader.svelte'
	import { trpc } from '$lib/trpc/client.js'
	import X from 'lucide-svelte/icons/x'
	import { toast } from 'svelte-sonner'

	import type { Event, FullEventUser, User, EventApiKey } from '@matterloop/db'
	import { tw } from '@matterloop/ui'
	import { capitalize, debounce, getMediaUrl } from '@matterloop/util'

	export let simplified = false
	export let inDialog = false
	export let titleClass = ''
	export let showTitle = true
	export let users: FullEventUser[] = []
	export let apiKeys: EventApiKey[] = []
	export let event: Partial<Event> = {
		name: '',
		subtitle: '',
		colors: { accent: '' },
		settings: { header_scripts: '' },
	}

	let loading = false
	let userSearchQuery = ''
	let eventUserType = { value: 'host', label: 'Host' }
	let eventUserTypes = [
		{ value: 'attendee', label: 'Attendee' },
		{ value: 'host', label: 'Host' },
		{ value: 'moderator', label: 'Moderator' },
		{ value: 'mc', label: 'MC' },
		{ value: 'speaker', label: 'Speaker' },
		{ value: 'panelist', label: 'Panelist' },
		{ value: 'facilitator', label: 'Facilitator' },
		{ value: 'staff', label: 'Staff' },
		{ value: 'volunteer', label: 'Volunteer' },
	].filter((t) => t.value !== 'attendee')
	// let eventTypes = [
	// 	{ value: 'main', label: 'Main Event' },
	// 	{ value: 'program', label: 'Program Event' },
	// 	{ value: 'panel', label: 'Panel' },
	// 	{ value: 'meetup', label: 'Meetup' },
	// 	{ value: 'meal', label: 'Group Meal' },
	// 	{ value: 'excursion', label: 'Excursion' },
	// ]
	$: buttonMsg = event?.id ? 'Save Event' : 'Add Event'
	$: editing = event?.id ? true : false
	$: event.colors = event.colors || { accent: '' }
	$: event.settings = event.settings || { header_scripts: '' }
	$: title = editing ? event?.name : 'Add an Event'
	// let type = eventTypes.find((t) => t.value === (event.type || 'program'))
	async function createEvent() {
		const res = await trpc().event.upsert.mutate(event)
		toast.success('Saved')
	}
	async function updateMedia(mediaId: string, remoteKey: string) {
		trpc().event.upsert.mutate({ id: event.id, [remoteKey]: mediaId })
		invalidateAll()
	}
	async function addUser(user: FullEventUser) {
		if (eventUserType?.value && event.id && user.userId) {
			await trpc().event.addUser.mutate({
				type: eventUserType.value,
				eventId: event.id,
				userId: user.userId,
			})
			invalidateAll()
		}
	}

	// API Key management
	let newApiKeyName = ''
	let createdApiKey: string | null = null

	async function createApiKey() {
		if (!newApiKeyName || !event.id) return

		try {
			const result = await trpc().event.createApiKey.mutate({
				eventId: event.id,
				name: newApiKeyName,
			})
			createdApiKey = result.key
			newApiKeyName = ''
			invalidateAll()
			toast.success('API key created successfully')
		} catch (error) {
			toast.error('Failed to create API key')
		}
	}

	async function deleteApiKey(id: string) {
		if (!confirm('Are you sure you want to delete this API key?')) return

		try {
			await trpc().event.deleteApiKey.mutate({ id })
			invalidateAll()
			toast.success('API key deleted')
		} catch (error) {
			toast.error('Failed to delete API key')
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text)
		toast.success('Copied to clipboard')
	}

	function truncateKey(key: string) {
		return key.substring(0, 12) + '...' + key.substring(key.length - 8)
	}
</script>

<form on:submit={createEvent}>
	<div class="grid {inDialog ? 'grid-cols-1 px-0' : 'grid-cols-[24rem_24rem]'} gap-8">
		<div>
			{#if showTitle}
				{#if inDialog}
					<Dialog.Header>
						<Dialog.Title>{title}</Dialog.Title>
					</Dialog.Header>
				{:else}
					<div class={tw(`mb-2 mt-0 text-2xl font-semibold ${titleClass}`)}>{title} Settings</div>
				{/if}
			{/if}
			<div class="grid gap-4 py-4">
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_name" class="text-right">Event Title</Label>
					<Input id="event_name" bind:value={event.name} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_subtitle" class="text-right">Sub Title</Label>
					<Input id="event_subtitle" bind:value={event.subtitle} class="col-span-3" />
				</div>
				<!-- <div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_name" class="text-right">Event Type</Label>
					<Select.Root bind:selected={type}>
						<Select.Trigger class="w-[180px]">
							<Select.Value placeholder="Select Type" />
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>Event Type</Select.Label>
								{#each eventTypes as { label, value }}
									<Select.Item value={value} label={label}>{label}</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="eventType" />
					</Select.Root>
				</div> -->
				<DatetimePicker bind:value={event.startsAt} />
				{#if !simplified}
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="description" class="text-right">Description</Label>
						<Textarea id="description" bind:value={event.description} class="col-span-3" />
					</div>
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="venue" class="text-right">Event Venue</Label>
						<SelectVenue bind:value={event.venueId} />
					</div>
				{/if}
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_replyEmail" class="text-right">Reply Email Address</Label>
					<Input id="event_replyEmail" bind:value={event.replyEmail} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_fromName" class="text-right">Email From Name</Label>
					<Input id="event_fromName" bind:value={event.emailFromName} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_accent" class="text-right">Accent Color</Label>
					<Input id="event_accent" bind:value={event.colors.accent} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="event_settings_head" class="text-right">Header Scripts</Label>
					<Textarea
						id="event_settings_head"
						bind:value={event.settings.header_scripts}
						class="col-span-3"
					/>
				</div>
			</div>
			<Button type="submit">{buttonMsg}</Button>
		</div>
		{#if !simplified && event?.id}
			<div class="mt-9 grid gap-4 px-4 py-4">
				<div>
					<div class="flex flex-col items-start justify-center gap-1 pb-1">
						<Label for="image" class="text-right">Event Image</Label>
					</div>
					<div
						class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
					>
						{#if event.photo}
							<img src={getMediaUrl(event.photo)} alt="at" class="w-full" />
						{/if}
						<div class="w-full bg-stone-100">
							<Uploader
								parentId={event.id}
								parentType="event"
								onSuccess={(mediaId) => updateMedia(mediaId, 'mediaId')}
							/>
						</div>
					</div>
				</div>
				<div>
					<div class="flex flex-col items-start justify-center gap-1 pb-1">
						<Label for="image" class="text-right">Event Large Logo</Label>
					</div>
					<div
						class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
					>
						{#if event.largeLogoId}
							<img src={getMediaUrl(event.largeLogo)} alt="at" class="w-full" />
						{/if}
						<div class="w-full bg-stone-100">
							<Uploader
								parentId={event.id}
								parentType="event-large-logo"
								onSuccess={(mediaId) => updateMedia(mediaId, 'largeLogoId')}
							/>
						</div>
					</div>
				</div>
				<div>
					<div class="flex flex-col items-start justify-center gap-1 pb-1">
						<Label for="image" class="text-right">Favicon Image</Label>
					</div>
					<div
						class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
					>
						{#if event.faviconId}
							<img src={getMediaUrl(event.favicon)} alt="at" class="w-full" />
						{/if}
						<div class="w-full bg-stone-100">
							<Uploader
								parentId={event.id}
								parentType="event-favicon"
								onSuccess={(mediaId) => updateMedia(mediaId, 'faviconId')}
							/>
						</div>
					</div>
				</div>

				<!-- API Keys Section -->
				<div class="mt-6">
					<div class="text-lg font-semibold mb-2">API Keys</div>
					<div class="mb-2 text-sm text-gray-600">
						Create API keys to access your event data from external applications.
					</div>

					{#if createdApiKey}
						<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
							<div class="mb-1 text-sm font-medium text-green-900">
								API Key Created Successfully!
							</div>
							<div class="text-xs text-green-700 mb-2">
								Copy this key now - you won't be able to see it again.
							</div>
							<div class="flex gap-2">
								<Input value={createdApiKey} readonly class="bg-white font-mono text-sm" />
								<Button
									type="button"
									variant="outline"
									size="sm"
									on:click={() => copyToClipboard(createdApiKey || '')}
								>
									Copy
								</Button>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="mt-2"
								on:click={() => (createdApiKey = null)}
							>
								Dismiss
							</Button>
						</div>
					{/if}

					<div
						class="mb-2 flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200"
					>
						{#each apiKeys || [] as apiKey}
							{@const { id, name, key, lastUsedAt, createdAt } = apiKey}
							<div class="group relative flex items-start justify-between gap-2 px-2.5 py-2">
								<div class="flex w-full flex-col gap-1">
									<div class="flex items-center justify-between">
										<div class="text-sm font-medium text-stone-700">{name}</div>
										<Button
											type="button"
											variant="ghost"
											class="my-0 h-6 px-1 py-2 opacity-0 transition-all group-hover:opacity-100"
											on:click={() => deleteApiKey(id)}
										>
											<X class="h-4 w-4 text-stone-500"></X>
										</Button>
									</div>
									<div class="flex items-center gap-2">
										<code class="text-xs text-stone-600 font-mono">{truncateKey(key)}</code>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="h-5 px-1 py-0 text-xs opacity-0 transition-all group-hover:opacity-100"
											on:click={() => copyToClipboard(key)}
										>
											Copy
										</Button>
									</div>
									<div class="text-xs text-stone-500">
										{#if lastUsedAt}
											Last used: {new Date(lastUsedAt).toLocaleDateString()}
										{:else}
											Never used
										{/if}
									</div>
								</div>
							</div>
						{:else}
							<div class="text-sm text-center text-gray-500 py-6">No API keys yet.</div>
						{/each}
					</div>

					<div class="rounded-lg bg-stone-100 p-3">
						<div class="mb-2 pl-0.5 text-sm font-medium text-gray-700">Create New API Key</div>
						<div class="flex gap-2">
							<Input
								bind:value={newApiKeyName}
								placeholder="API Key Name (e.g., Production App)"
								class="bg-white"
							/>
							<Button
								type="button"
								variant="default"
								size="sm"
								on:click={createApiKey}
								disabled={!newApiKeyName}
							>
								Create
							</Button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</form>
