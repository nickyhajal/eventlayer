<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import Button from '$lib/components/ui/button/button.svelte'
	import ChicletButton from '$lib/components/ui/ChicletButton.svelte'
	import * as Dialog from '$lib/components/ui/dialog'
	import Input from '$lib/components/ui/input/input.svelte'
	import Label from '$lib/components/ui/label/label.svelte'
	import * as Select from '$lib/components/ui/select'
	import Switch from '$lib/components/ui/switch/switch.svelte'
	import Textarea from '$lib/components/ui/textarea/textarea.svelte'
	import Uploader from '$lib/components/ui/Uploader.svelte'
	import { trpc } from '$lib/trpc/client.js'
	import { getMediaUrl } from '$lib/util/getMediaUrl'
	import Check from 'lucide-svelte/icons/check'
	import { toast } from 'svelte-sonner'

	import type { EventUserField, FullEventUser, User } from '@matterloop/db'
	import { merge, tw } from '@matterloop/util'

	export let user: Partial<FullEventUser> = {
		firstName: '',
		lastName: '',
		email: '',
		type: 'attendee',
	}
	export let simplified = false
	export let inDialog = false
	export let titleClass = ''
	export let showTitle = true
	// Custom fields passed from the page
	export let customFields: EventUserField[] = []
	let error = ''
	let userInEvent = false
	let emailConfirmed: string = user?.id ? 'existing-user' : ''

	// Build default info object including custom fields
	function buildDefaultInfo() {
		const defaultInfo: Record<string, { value: string }> = {
			company: { value: '' },
			title: { value: '' },
			linkedin_url: { value: '' },
			speechTitle: { value: '' },
			diveTeam: { value: '' },
			dinnerTable: { value: '' },
			bio: { value: '' },
		}
		// Add custom fields to default info
		customFields.forEach((field) => {
			defaultInfo[field.key] = { value: '' }
		})
		return defaultInfo
	}

	user.info = merge(buildDefaultInfo(), user?.info || {})

	// Helper to get custom field value with proper type handling
	function getCustomFieldValue(key: string): string {
		return user.info?.[key]?.value ?? ''
	}

	// Helper to set custom field value
	function setCustomFieldValue(key: string, value: string) {
		if (!user.info) user.info = {}
		if (!user.info[key]) user.info[key] = { value: '' }
		user.info[key].value = value
	}
	$: buttonMsg = emailConfirmed ? (user?.id ? 'Save User' : 'Add User') : 'Check Email'
	$: editing = user?.id ? true : false
	$: title = editing ? `${user?.firstName} ${user?.lastName}` : 'Add a User'
	let userTypes = [
		{ value: 'attendee', label: 'Attendee' },
		// { value: 'main-stage', label: 'Main Stage Only Attendee' },
		{ value: 'speaker', label: 'Speaker' },
		{ value: 'ambassador', label: 'Ambassador' },
		// { value: 'main-stage-speaker', label: 'Main Stage Speaker' },
		// { value: 'on-stage-host', label: 'On Stage Host' },
		// { value: 'showcase-speaker', label: 'Showcase Speaker' },
		// { value: 'impact-partner', label: 'Impact Partner' },
		// { value: 'organizing-partner', label: 'Organizing Partner' },
		// { value: 'divesession-facilitator', label: 'Dive-Session Facilitator' },
		// { value: 'sponsor', label: 'Sponsor Rep' },
		{ value: 'staff', label: 'Staff' },
	]
	let type = user?.type
		? userTypes.find(({ value }) => value === user.type)
		: { value: 'attendee', label: 'Attendee' }
	$: user.type = type.value
	let userExistsNotInEvent: User | false = false
	let image = ''
	async function saveUser() {
		if (!emailConfirmed) {
			await checkEmail()
			return
		} else {
			const res = await trpc().user.upsert.mutate(user)
			if (!user.id && res?.user?.id) {
				goto(`/manage/people/${res.eventUser.id}`)
			}
			toast.success('User Saved')
		}
	}
	async function updateAvatar(mediaId: string) {
		await trpc().user.upsert.mutate({ userId: user.userId, mediaId })
		await invalidateAll()
	}
	async function deactivateUser() {
		await trpc().user.upsert.mutate({
			userId: user.userId,
			status: 'inactive',
		})
		invalidateAll()
	}
	async function activateUser() {
		await trpc().user.upsert.mutate({ userId: user.userId, status: 'active' })
		invalidateAll()
	}
	async function checkEmail() {
		if (user.email) {
			const res = await trpc().user.checkEmail.query({ email: user.email })
			if (res.emailExists) {
				if (res.eventUserExists) {
					userInEvent = true
					error = 'This user is already part of this event.'
					emailConfirmed = ''
					toast.error('This email is already registered for this event')
					return
				} else {
					userExistsNotInEvent = res.emailExists.id
					user.firstName = res.emailExists.firstName
					user.lastName = res.emailExists.lastName
					user.userId = res.emailExists.id
					emailConfirmed = 'user-exists'
					return
				}
			}
			emailConfirmed = 'create-user'
		}
	}
</script>

{#if user?.status !== 'active' && !simplified}
	<div class="mb-4 rounded-md bg-red-50 p-3 text-center text-sm font-semibold text-red-700/80">
		User not attending event
	</div>
{/if}
<form on:submit={saveUser}>
	{#if showTitle}
		{#if inDialog}
			<Dialog.Header>
				<Dialog.Title>{title}</Dialog.Title>
			</Dialog.Header>
		{:else}
			<div class="flex gap-4">
				<div class={tw(`mb-2 mt-0 text-lg font-semibold ${titleClass}`)}>
					{title}
				</div>
			</div>
		{/if}
	{/if}
	<div class="grid gap-4 py-4">
		{#if error}
			<div class="text-base">{error}</div>
		{/if}
		{#if emailConfirmed}
			{#if !simplified && user?.id}
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="image" class="text-right">User Image</Label>
				</div>
				<div
					class="flex flex-col items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
				>
					{#if user.photo}
						<img src={getMediaUrl(user.photo)} alt="at" class="w-full" />
					{/if}
					<div class="w-full bg-stone-100">
						<Uploader parentId={user.id} parentType="user" onSuccess={updateAvatar} />
					</div>
				</div>
			{/if}
		{/if}
		{#if emailConfirmed !== 'existing-user'}
			<div
				class="flex flex-col items-start justify-center gap-1 {emailConfirmed === 'create-user'
					? '-mx-6 mb-2 border-b border-emerald-500/20 bg-emerald-50/40 p-6'
					: ''}"
			>
				<div class="flex items-center gap-2">
					<Label for="email" class="text-right">E-Mail Address</Label>
					{#if emailConfirmed}
						<div class="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
							<Check class="w-3 text-white" />
						</div>
					{/if}
					<!-- <CheckCircle class="w-4 text-emerald-500" /> -->
				</div>
				<div class="mb-1 mt-0.5 text-xs font-medium text-gray-500">
					Enter the user's email address so we can verify their account
				</div>
				<Input
					id="email"
					bind:value={user.email}
					data-lpignore="true"
					data-1p-ignore="true"
					class="col-span-3"
					disabled={emailConfirmed === 'create-user' || userExistsNotInEvent}
				/>
			</div>
		{/if}
		{#if emailConfirmed}
			<div class="flex flex-col items-start justify-center gap-1">
				<Label for="userType" class="text-right">User Type</Label>
				<Select.Root bind:selected={type}>
					<Select.Trigger class="w-[220px]">
						<Select.Value placeholder="Select Type" />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>User Type</Select.Label>
							{#each userTypes as { label, value }}
								<Select.Item {value} {label}>{label}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
					<Select.Input name="userType" />
				</Select.Root>
			</div>
			<div class="flex gap-2">
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="firstName" class="text-right">First Name</Label>
					<Input
						id="firstName"
						bind:value={user.firstName}
						class="col-span-3"
						disabled={userExistsNotInEvent}
					/>
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="lastName" class="text-right">Last Name</Label>
					<Input
						id="lastName"
						bind:value={user.lastName}
						class="col-span-3"
						disabled={userExistsNotInEvent}
					/>
				</div>
			</div>
			{#if emailConfirmed === 'existing-user'}
				<div class="flex flex-col items-start justify-center gap-1">
					<div class="flex items-center gap-2">
						<Label for="email" class="text-right">E-Mail Address</Label>
					</div>
					<Input id="email" bind:value={user.email} class="col-span-3" />
				</div>
			{/if}
			{#if !simplified}
				<div class="flex gap-2">
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="company" class="text-right">Company</Label>
						<Input id="company" bind:value={user.info.company.value} class="col-span-3" />
					</div>
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="title" class="text-right">Title</Label>
						<Input id="title" bind:value={user.info.title.value} class="col-span-3" />
					</div>
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="url" class="text-right">User Url (LinkedIn, Website, etc)</Label>
					<Input
						id="url"
						type="text"
						bind:value={user.info.linkedin_url.value}
						class="col-span-3"
					/>
					<a href={user.info.linkedin_url.value} target="_blank" class="text-sm text-slate-600">
						{user.info.linkedin_url.value}
					</a>
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="proBio" class="text-right">Professional Bio</Label>
					<Textarea id="proBio" bind:value={user.proBio} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="bio" class="text-right">User Bio</Label>
					<Textarea id="bio" bind:value={user.info.bio.value} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="dinnerTable" class="text-right">Dinner Table</Label>
					<Input
						id="dinnerTable"
						type="text"
						bind:value={user.info.dinnerTable.value}
						class="col-span-3"
					/>
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="diveTeam" class="text-right">Dive Team</Label>
					<Input
						id="diveTeam"
						type="text"
						bind:value={user.info.diveTeam.value}
						class="col-span-3"
					/>
				</div>
				<!--{#if user.type.includes('speaker')}
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="speechTitle" class="text-right">Talk Title</Label>
						<Input
							id="speechTitle"
							type="text"
							bind:value={user.info.speechTitle.value}
							class="col-span-3"
						/>
					</div>
				{/if} -->

				<!-- Custom Fields Section -->
				<!-- TODO: Implement attendee-editable fields in PWA profile edit -->
				{#if customFields.length > 0}
					<div class="mt-4 border-t border-stone-200 pt-4">
						<Label class="mb-3 block text-sm font-semibold text-stone-700">Custom Fields</Label>
						{#each customFields as field (field.id)}
							<div class="mb-3 flex flex-col items-start justify-center gap-1">
								<Label for={`custom-${field.key}`} class="text-right">{field.label}</Label>
								{#if field.fieldType === 'text'}
									<Input
										id={`custom-${field.key}`}
										type="text"
										value={getCustomFieldValue(field.key)}
										on:input={(e) => setCustomFieldValue(field.key, e.currentTarget.value)}
										class="col-span-3"
									/>
								{:else if field.fieldType === 'textarea'}
									<Textarea
										id={`custom-${field.key}`}
										value={getCustomFieldValue(field.key)}
										on:input={(e) => setCustomFieldValue(field.key, e.currentTarget.value)}
										class="col-span-3"
									/>
								{:else if field.fieldType === 'boolean'}
									<Switch
										id={`custom-${field.key}`}
										checked={getCustomFieldValue(field.key) === 'true'}
										onCheckedChange={(checked) =>
											setCustomFieldValue(field.key, checked ? 'true' : 'false')}
									/>
								{:else if field.fieldType === 'options'}
									{@const options = field.options?.split(',').map((o) => o.trim()) || []}
									<Select.Root
										selected={options.includes(getCustomFieldValue(field.key))
											? {
													value: getCustomFieldValue(field.key),
													label: getCustomFieldValue(field.key),
												}
											: undefined}
										onSelectedChange={(v) => setCustomFieldValue(field.key, v?.value || '')}
									>
										<Select.Trigger class="w-full">
											<Select.Value placeholder="Select an option" />
										</Select.Trigger>
										<Select.Content>
											{#each options as option}
												<Select.Item value={option} label={option}>{option}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		{/if}
	</div>
	<div class="flex w-full justify-between">
		{#if user?.status === 'active'}
			<Button
				variant="ghost"
				class="px-2.5 font-semibold text-red-700/70 hover:text-red-700"
				on:click={() => deactivateUser()}>Remove from Event</Button
			>
		{:else if !simplified}
			<Button
				variant="ghost"
				class="bg-emerald-50 px-2.5 font-semibold text-emerald-600/70 hover:bg-emerald-50 hover:text-emerald-600"
				on:click={() => activateUser()}>Add to Event</Button
			>
		{/if}
		<div class="flex justify-end">
			<Button type="submit">{buttonMsg}</Button>
		</div>
	</div>
</form>
