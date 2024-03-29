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
import Check from 'lucide-svelte/icons/check'
import { toast } from 'svelte-sonner'

import type { FullEventUser, User } from '@matterloop/db'
import { tw } from '@matterloop/util'

export let user: Partial<FullEventUser> = {
	firstName: '',
	lastName: '',
	email: '',
	type: 'attendee',
}
export let simplified = false
export let inDialog = false
export let titleClass = ''
let error = ''
let userInEvent = false
let emailConfirmed: string = user?.id ? 'existing-user' : ''
$: buttonMsg = emailConfirmed ? (user?.id ? 'Save User' : 'Add User') : 'Check Email'
$: editing = user?.id ? true : false
$: title = editing ? `${user?.firstName} ${user?.lastName}` : 'Add a User'
let userTypes = [
	{ value: 'attendee', label: 'Attendee' },
	{ value: 'speaker', label: 'Speaker' },
	{ value: 'sponsor', label: 'Sponsor Rep' },
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
	trpc().user.upsert.mutate({ userId: user.userId, mediaId })
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

<form on:submit={saveUser}>
	{#if inDialog}
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
		</Dialog.Header>
	{:else}
		<div class={tw(`mb-2 mt-0 text-lg font-semibold ${titleClass}`)}>{title}</div>
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
				class="flex flex-col items-start justify-center gap-1 {emailConfirmed === 'create-user' ? '-mx-6 mb-2 border-b border-emerald-500/20 bg-emerald-50/40 p-6' : ''}"
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
					<Select.Trigger class="w-[180px]">
						<Select.Value placeholder="Select Type" />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Label>User Type</Select.Label>
							{#each userTypes as { label, value }}
								<Select.Item value={value} label={label}>{label}</Select.Item>
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
						<Input id="company" bind:value={user.company} class="col-span-3" />
					</div>
					<div class="flex flex-col items-start justify-center gap-1">
						<Label for="title" class="text-right">Title</Label>
						<Input id="title" bind:value={user.title} class="col-span-3" />
					</div>
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="url" class="text-right">User Url (LinkedIn, Website, etc)</Label>
					<Input id="url" type="url" bind:value={user.url} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="proBio" class="text-right">Professional Bio</Label>
					<Textarea id="proBio" bind:value={user.proBio} class="col-span-3" />
				</div>
				<div class="flex flex-col items-start justify-center gap-1">
					<Label for="bio" class="text-right">User Bio</Label>
					<Textarea id="bio" bind:value={user.bio} class="col-span-3" />
				</div>
			{/if}
		{/if}
	</div>
	<div class="flex justify-end"><Button type="submit">{buttonMsg}</Button></div>
</form>
