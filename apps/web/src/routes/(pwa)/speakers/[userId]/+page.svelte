<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
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
</script>

<Screen title={name} back="/speakers">
	<div class="mx-auto max-w-7xl py-6">
		<div class="text-base font-semibold text-red-600">
			<!-- {dayjs(data.v.startsAt).format('dddd MMMM Do [at] h:mma')} -->
		</div>
		<div class="flex items-end gap-2 pb-6">
			<img src={getMediaUrl(user.photo)} class="xs:w-36 w-28 rounded-xl" alt={`Photo of ${name}`} />
			<div class="flex flex-col">
				<div class="xs:text-3xl pb-0 text-2xl font-bold">{name}</div>
				{#if user?.title}
					<div class="xs:text-base pb-0 text-[0.9rem] font-semibold text-slate-700">
						{user.title}
					</div>
				{/if}
				{#if user?.company}
					<div class="pb-0 text-sm font-medium text-slate-600">{user.company}</div>
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
				class="-mt-2 mb-4 h-9 w-full rounded-lg bg-sky-700 text-sm"
			>
				Connect on LinkedIn
			</Button>
		{/if}
		<Markdown data={user.proBio} class="pr-4 text-slate-600" />
	</div>
</Screen>
