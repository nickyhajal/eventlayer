<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import EventRow from '$lib/components/EventRow.svelte'
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import UserAvatar from '$lib/components/UserAvatar.svelte'
	import { trpc } from '$lib/trpc/client.js'
	import FBIcon from 'lucide-svelte/icons/facebook'
	import SiteIcon from 'lucide-svelte/icons/globe'
	import IGIcon from 'lucide-svelte/icons/instagram'
	import LinkedInIcon from 'lucide-svelte/icons/linkedin'
	import Pin from 'lucide-svelte/icons/map-pin'
	import PhoneIcon from 'lucide-svelte/icons/phone'
	import SmileIcon from 'lucide-svelte/icons/smile'
	import SmilePlusIcon from 'lucide-svelte/icons/smile-plus'

	import { Markdown } from '@matterloop/ui'
	import { capitalize, dayjs, startCase } from '@matterloop/util'

	export let data
	$: user = data.user
	$: events = data.events
	$: eventStr = events.reduce((acc, event, i) => {
		return `${acc}${capitalize(event.type)}: ${event.event.name}${
			events.length - 1 === i ? '' : ', '
		}`
	}, '')
	$: name = `${user.firstName} ${user.lastName}`

	function instagramUrl(str: string) {
		str = str.replace('@', '').replace('http://', '')
		if (!str.includes('instagram.com')) return `https://instagram.com/${str}`
		if (!str.includes('https://')) return `https://${str}`
		return str
	}
	function fbUrl(str: string) {
		str = str.replace('@', '').replace('http://', '')
		if (!str.includes('facebook.com')) return `https://facebook.com/${str}`
		if (!str.includes('https://')) return `https://${str}`
		return str
	}
	function linkedinUrl(str: string) {
		str = str.replace('http://', '')
		if (!str.includes('linkedin.com')) return `https://linkedin.com/in/${str}`
		if (!str.includes('https://')) return `https://${str}`
		return str
	}
	function siteUrl(str: string) {
		str = str.replace('http://', '')
		if (!str.includes('https://')) return `https://${str}`
		return str
	}
	const buttonClass =
		'grid grid-cols-[3rem_1fr] items-center overflow-hidden hover:bg-blue-50 relative p-0 flex-grow h-9 w-fit  rounded-lg bg-slate-100 text-slate-700 text-center text-sm'

	// const why = {
	// 	community: 'Join a community of like-minded people in Oregon',
	// 	learn: 'Learn about climate technology advancements being made in Oregon',
	// 	connect: 'Connect with other people from other knowledge areas than my own',
	// 	contribute:
	// 		'Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.',
	// 	understand: 'Understand how I can help support climate efforts in Oregon',
	// 	justice: 'Learn about climate justice in Oregon',
	// }

	// const topics = {
	// 	behavior: 'Behavior & Adoption',
	// 	future: 'Future-Planning',
	// 	health: 'Health',
	// 	workforce: 'Workforce',
	// 	energy: 'Energy & Storage',
	// 	buildings: 'Buildings',
	// 	vehicles: 'Vehicles',
	// }
	// $: openToWork = user?.info?.['seeking-job']?.value === '["yes"]'
	// $: openToHire = user?.info?.['hiring']?.value === '["yes"]'
	function info(key: string) {
		return user?.info[key]?.value
	}
	$: title = [info('title'), info('location')].filter(Boolean).join(' - ')
	$: console.log('data.me', data.me)
	$: isMyFriend = data.me?.connectionsTo?.some((c) => c.toId === user?.id)
	$: didFriendMe = data.me?.connectionsFrom?.some((c) => c.fromId === user?.id)
	let loading = false
	const questions = [
		{ label: `What's your super power?`, key: 'superpower' },
		{ label: `Ask me about...`, key: 'ask-me' },
	]
	async function toggleFriend() {
		if (loading) return
		loading = true
		await trpc().user.toggleConnection.mutate({ userId: user?.id })
		invalidateAll()
		loading = false
	}
</script>

<Screen title={name} back="/speakers">
	<div class="mx-auto max-w-7xl pb-28 pt-safe-offset-8 lg:pt-0">
		<div class="text-base font-semibold text-red-600">
			<!-- {dayjs(data.v.startsAt).format('dddd MMMM Do [at] h:mma')} -->
		</div>
		<div class="flex flex-col items-center gap-2 pb-6">
			<!-- {#if openToWork || openToHire}
				<div class="mb-4 flex items-center gap-2.5">
					{#if openToWork}
						<div
							class="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-0.5 text-sm font-medium text-emerald-700"
						>
							Open for Work
						</div>
					{/if}
					{#if openToHire}
						<div
							class="rounded-md border border-amber-100 bg-amber-50 px-3 py-0.5 text-sm font-medium text-amber-700"
						>
							Looking to Hire
						</div>
					{/if}
				</div>
			{/if} -->
			<UserAvatar {user} class="h-36 w-28 rounded-full xs:w-36" />
			<div class="flex gap-2">
				{#if user.type !== 'attendee'}
					<div class="mt-3 rounded-md bg-slate-50 px-3 py-0.5 text-sm font-medium text-slate-700">
						{startCase(user.type)}
					</div>
				{/if}
				{#if isMyFriend || didFriendMe}
					<div class="mt-3 rounded-md bg-slate-50 px-3 py-0.5 text-sm font-medium text-slate-700">
						{#if isMyFriend && didFriendMe}
							Mutual Friend
						{:else if isMyFriend}
							Your Friend
						{:else}
							Friended You
						{/if}
					</div>
				{/if}
			</div>
			<div class="flex flex-col text-center">
				<div class="pb-0 text-2xl font-bold xs:text-3xl">{name}</div>
				{#if info('title')}
					<div
						class="flex justify-center pb-0 text-[0.9rem] font-semibold text-slate-700 xs:text-base"
					>
						{info('title')}
						{#if info('location')}
							<span class="flex items-center gap-0.5 pl-3">
								<Pin class="inline w-4 fill-blue-100 stroke-blue-300 text-stone-600" />
								{info('location')}
							</span>
						{/if}
					</div>
				{/if}
				{#if info('company')}
					<div class="pb-0 text-sm font-medium text-slate-600">{info('company')}</div>
				{/if}
			</div>
		</div>
		<div class="flex flex-wrap gap-2">
			<div class="-mt-3 mb-5 text-xs text-a-accent">
				{eventStr}
			</div>
		</div>
		<div class="flex flex-col gap-4">
			<div class="mb-4 flex flex-wrap justify-start gap-2">
				<div
					class="mb-3.5 flex w-full items-center justify-center border-b border-b-slate-100 pb-6"
				>
					<Button
						{loading}
						href="#add-friend"
						on:click={toggleFriend}
						class="relative grid h-9 w-fit grid-cols-[3rem_1fr] items-center overflow-hidden rounded-lg  bg-slate-100   p-0 text-center text-sm text-slate-700 hover:bg-blue-50"
					>
						<div
							class="flex h-full items-center justify-center border-r border-slate-300/50 bg-slate-200/50 px-3"
						>
							{#if isMyFriend}
								<SmileIcon class="inline w-4 text-green-600" />
							{:else}
								<SmilePlusIcon class="inline w-4 text-blue-800" />
							{/if}
						</div>
						{#if isMyFriend}
							<div class="px-16">Remove Friend</div>
						{:else}
							<div class="px-16">Add Friend</div>
						{/if}
					</Button>
				</div>
				{#if info('site')}
					<Button
						href={siteUrl(info('site') || '')}
						target="_blank"
						rel="noopener noreferrer"
						class="relative grid h-9 w-fit min-w-[32%] flex-grow grid-cols-[3rem_1fr] items-center overflow-hidden rounded-lg bg-slate-100  p-0 text-center text-sm text-slate-700 hover:bg-blue-50"
					>
						<div
							class="flex h-full items-center justify-center border-r border-slate-300/50 bg-slate-200/50 px-3"
						>
							<SiteIcon class="inline w-4 text-teal-800" />
						</div>
						<div class="px-3">View their Site</div>
					</Button>
				{/if}
				{#if info('linkedin_url')}
					<Button
						href={linkedinUrl(info('linkedin_url') || '')}
						target="_blank"
						rel="noopener noreferrer"
						class="relative grid h-9 w-fit flex-grow grid-cols-[3rem_1fr] items-center overflow-hidden rounded-lg bg-slate-100  p-0 text-center text-sm text-slate-700 hover:bg-blue-50"
					>
						<div
							class="flex h-full items-center justify-center border-r border-slate-300/50 bg-slate-200/50 px-3"
						>
							<LinkedInIcon class="inline w-4 text-sky-800" />
						</div>
						<div class="px-3">Connect on LinkedIn</div>
					</Button>
				{/if}
				{#if info('ig_url')}
					<Button
						href={instagramUrl(info('ig_url') || '')}
						target="_blank"
						rel="noopener noreferrer"
						class="relative grid h-9  w-fit min-w-[32%] flex-grow grid-cols-[3rem_1fr] items-center overflow-hidden rounded-lg bg-slate-100  p-0 text-center text-sm text-slate-700 hover:bg-blue-50"
					>
						<div
							class="flex h-full items-center justify-center border-r border-slate-300/50 bg-slate-200/50 px-3"
						>
							<IGIcon class="inline w-4 text-red-800" />
						</div>
						<div class="px-3">Connect on Instagram</div>
					</Button>
				{/if}
				{#if info('fb_url')}
					<Button
						href={fbUrl(info('fb_url') || '')}
						target="_blank"
						rel="noopener noreferrer"
						class="relative grid h-9 w-fit min-w-[32%] flex-grow grid-cols-[3rem_1fr] items-center overflow-hidden rounded-lg bg-slate-100  p-0 text-center text-sm text-slate-700 hover:bg-blue-50"
					>
						<div
							class="flex h-full items-center justify-center border-r border-slate-300/50 bg-slate-200/50 px-3"
						>
							<FBIcon class="inline w-4 text-blue-800" />
						</div>
						<div class="px-3">Connect on Facebook</div>
					</Button>
				{/if}
				{#if info('phone_shared')}
					<Button
						href={`tel:${info('phone_shared')}`}
						class="relative grid h-9 w-fit min-w-[32%] flex-grow grid-cols-[3rem_1fr] items-center overflow-hidden rounded-lg bg-slate-100  p-0 text-center text-sm text-slate-700 hover:bg-blue-50"
					>
						<div
							class="flex h-full items-center justify-center border-r border-slate-300/50 bg-slate-200/50 px-3"
						>
							<PhoneIcon class="inline w-4 text-blue-800" />
						</div>
						<div class="px-3">Show Phone Number</div>
					</Button>
				{/if}
			</div>
			{#if user.bio}
				<div class="border-t border-slate-200 pb-8 pt-8"></div>
			{/if}
			<Markdown
				data={user.bio || user.info?.bio?.value || ''}
				class="border-b border-slate-200 pb-4 text-lg font-medium text-slate-600"
			/>
			{#if user.proBio}
				<Markdown data={user.proBio} class="border-t border-slate-200 pr-4 pt-8 text-slate-600" />
			{/if}
			<div class="mt-10">
				{#each questions as { label, key }}
					{#if info(key)}
						<div class="pb-8">
							<h3 class="text-xl font-semibold">{label}</h3>
							<div class="w-fit text-base font-medium text-slate-600">
								{info(key)}
							</div>
						</div>
					{/if}
				{/each}
			</div>
			{#if user?.info?.['speechTitle']?.value}
				<div class="mt-1 pt-8">
					<div class="mb-2 font-semibold">Talk Title</div>
					<div class="w-fit text-sm font-medium text-slate-600">
						{user?.info?.['speechTitle']?.value}
					</div>
				</div>
			{/if}
		</div>
		{#if user?.info?.['traveling-from']?.value?.length}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Traveling From:</div>
				<div
					class="w-fit rounded-md border border-slate-200/50 px-2 py-1 text-sm font-medium text-slate-600"
				>
					{user?.info?.['traveling-from']?.value}
				</div>
			</div>
		{/if}
		{#if user?.info?.['why']?.value?.length > 2}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Coming to Wings in order to:</div>
				<div class="flex flex-col gap-1">
					{#each JSON.parse(user?.info?.['why']?.value) as key}
						{#if why[key]}
							<div
								class="w-fit rounded-md border border-slate-200/50 px-2 py-1 text-sm font-medium text-slate-600"
							>
								{why[key]}
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
		{#if user?.info?.['interests']?.value?.length > 2}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Interested in:</div>
				<div class="flex">
					<div class="flex flex-wrap gap-1">
						{#each JSON.parse(user?.info?.['interests']?.value) as key}
							{#if topics[key]}
								<div
									class="w-fit rounded-md border border-slate-200/50 px-2 py-1 text-sm font-medium text-slate-600"
								>
									{topics[key]}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</Screen>
