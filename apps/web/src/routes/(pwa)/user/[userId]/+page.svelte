<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import UserAvatar from '$lib/components/UserAvatar.svelte'
import VenueBlock from '$lib/components/VenueBlock.svelte'
import { getMeContext } from '$lib/state/getContexts'

import type { Event } from '@matterloop/db'
import { Markdown } from '@matterloop/ui'
import { capitalize, dayjs, getMediaUrl, startCase } from '@matterloop/util'

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
$: openToWork = user?.info?.['seeking-job']?.value === '["yes"]'
$: openToHire = user?.info?.['hiring']?.value === '["yes"]'
</script>

<Screen title={name} back="/speakers">
	<div class="mx-auto max-w-7xl pb-28 pt-6 lg:pt-0">
		<div class="text-base font-semibold text-red-600">
			<!-- {dayjs(data.v.startsAt).format('dddd MMMM Do [at] h:mma')} -->
		</div>
		<div class="flex flex-col items-center gap-2 pb-6">
			{#if openToWork || openToHire}
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
			{/if}
			<UserAvatar user={user} class="xs:w-36 h-36 w-28 rounded-full" />
			{#if user.type !== 'attendee'}
				<div class="mt-3 rounded-md bg-slate-50 px-3 py-0.5 text-sm font-medium text-slate-700">
					{startCase(user.type)}
				</div>
			{/if}
			<div class="flex flex-col text-center">
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
			<div class="text-a-accent -mt-3 mb-5 text-xs">
				{eventStr}
			</div>
		</div>
		{#if user?.url}
			<Button
				href={user.url}
				target="_blank"
				rel="noopener noreferrer"
				class="relative mx-auto -mt-2 mb-10 block h-9 w-full max-w-sm rounded-lg bg-sky-700 text-center text-sm"
			>
				Connect on LinkedIn
			</Button>
		{/if}
		{#if user.bio}
			<div class="border-t border-slate-200 pb-8 pt-8"></div>
		{/if}
		<Markdown
			data={user.bio || user.info?.bio?.value || ''}
			class="text-lg font-medium text-slate-600"
		/>
		{#if user.proBio}
			<Markdown data={user.proBio} class="border-t border-slate-200 pr-4 pt-8 text-slate-600" />
		{/if}
		{#if user?.info?.['speechTitle']?.value}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Talk Title</div>
				<div class="w-fit text-sm font-medium text-slate-600">
					{user?.info?.['speechTitle']?.value}
				</div>
			</div>
		{/if}
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
		{#if user?.info?.['why-attending']?.value?.length > 2}
			<div class="mt-1 pt-8">
				<div class="mb-2 font-semibold">Coming to Wings in order to:</div>
				<div class="flex flex-col gap-1">
					{#each JSON.parse(user?.info?.['why-attending']?.value) as key}
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
