<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import UserAvatar from '$lib/components/UserAvatar.svelte'
import VenueBlock from '$lib/components/VenueBlock.svelte'
import { getMeContext } from '$lib/state/getContexts'

import type { Event } from '@matterloop/db'
import { Markdown } from '@matterloop/ui'
import { capitalize, dayjs, getMediaUrl } from '@matterloop/util'

export let data
$: user = data.user
$: events = data.events
$: eventStr = events.reduce((acc, event, i) => {
	return `${acc}${capitalize(event.type)}: ${event.event.name}${
		events.length - 1 === i ? '' : ', '
	}`
}, '')
$: name = `${user.firstName} ${user.lastName}`

const why = {
	community: 'Join a community of like-minded people in Oregon',
	learn: 'Learn about climate technology advancements being made in Oregon',
	connect: 'Connect with other people from other knowledge areas than my own',
	contribute:
		'Contribute to climate tech policy recommendations for Oregon spanning economic development, workforce, etc.',
	understand: 'Understand how I can help support climate efforts in Oregon',
	justice: 'Learn about climate justice in Oregon',
}

const topics = {
	behavior: 'Behavior & Adoption',
	future: 'Future-Planning',
	health: 'Health',
	workforce: 'Workforce',
	energy: 'Energy & Storage',
	buildings: 'Buildings',
	vehicles: 'Vehicles',
}
</script>

<Screen title={name} back="/speakers">
	<div class="mx-auto max-w-7xl py-6">
		<div class="text-base font-semibold text-red-600">
			<!-- {dayjs(data.v.startsAt).format('dddd MMMM Do [at] h:mma')} -->
		</div>
		<div class="flex items-end gap-2 pb-6">
			<UserAvatar user={user} class="xs:w-36 h-36 w-28 rounded-full" />
			<div class="flex flex-col">
				<div class="xs:text-3xl pb-0 text-2xl font-bold">{name}</div>
				{#if user?.info.title}
					<div class="xs:text-base pb-0 text-[0.9rem] font-semibold text-slate-700">
						{user.info.title.value}
					</div>
				{/if}
				{#if user?.info.company}
					<div class="pb-0 text-sm font-medium text-slate-600">{user.info.company.value}</div>
				{/if}
			</div>
		</div>
		<div class="flex flex-wrap gap-2">
			<div class="text-main -mt-3 mb-5 text-xs">
				{eventStr}
			</div>
		</div>
		{#if user?.url}
			<Button
				href={user.url}
				target="_blank"
				rel="noopener noreferrer"
				class="-mt-2 mb-4 h-9 w-full rounded-lg bg-sky-700 text-sm"
			>
				Connect on LinkedIn
			</Button>
		{/if}
		<Markdown data={user.proBio} class="mt-6 pr-4 text-slate-600" />
		{#if user?.info?.['traveling-from']?.value}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Traveling From:</div>
				<div class="">
					{user?.info?.['traveling-from']?.value}
				</div>
			</div>
		{/if}
		{#if user?.info?.['why-attending']?.value}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Coming to wings in order to:</div>
				{#each JSON.parse(user?.info?.['why-attending']?.value) as key}
					{#if why[key]}
						<div class="">
							{why[key]}
						</div>
					{/if}
				{/each}
			</div>
		{/if}
		{#if user?.info?.['interests']?.value}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Interested in:</div>
				<div class="flex">
					{#each JSON.parse(user?.info?.['interests']?.value) as key}
						{#if topics[key]}
							<div class="border border-slate-100 p-1">
								{topics[key]}
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
		{#if user?.info?.['seeking-job']?.value}
			<div class="mt-8 border-t-2 border-slate-700 pt-8">
				{user?.info?.['seeking-job']?.value}
			</div>
		{/if}
		{#if user?.info?.['hiring']?.value}
			<div class="mt-8 border-t-2 border-slate-700 pt-8">
				{user?.info?.['hiring']?.value}
			</div>
		{/if}
	</div>
</Screen>
