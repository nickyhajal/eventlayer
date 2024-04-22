<script lang="ts">
import EventRow from '$lib/components/EventRow.svelte'
import Screen from '$lib/components/Screen.svelte'
import UserBlock from '$lib/components/UserBlock.svelte'
import VenueBlock from '$lib/components/VenueBlock.svelte'
import { getMeContext } from '$lib/state/getContexts'

import type { Event, EventUser } from '@matterloop/db'
import Markdown from '@matterloop/ui/src/components/Markdown.svelte'
import { capitalize, dayjs, orderBy } from '@matterloop/util'

export let data
$: event = data.event
$: console.log(data.user)
$: users = orderBy(data.users, ['type'])
let lastType = ''
function getLastType(user: EventUser) {
	if (user.type !== lastType && user.type) {
		lastType = user.type
		return true
	}
}
</script>

<Screen
	title={data.event.name}
	bigTitle={event.photo ? " " : ""}
	back="/schedule"
	photo={event.photo}
>
	<div class="mx-auto max-w-7xl py-6">
		<div class="text-a-accent text-base font-semibold">
			{dayjs(data.event.startsAt).format('dddd MMMM Do [at] h:mma')}
		</div>
		<div class="pb-3 text-3xl font-bold">{event.name}</div>
		{#if event.subtitle}
			<div class="-mt-2 pb-3 pr-6 text-base font-semibold leading-snug text-slate-600">
				{event.subtitle}
			</div>
		{/if}
		{#if event.description}
			<div class="text-slate-600">
				<Markdown data={event.description} />
			</div>
		{/if}
		{#if event?.venue}
			<div class="mt-8">
				<VenueBlock venue={event.venue} />
			</div>
		{/if}
		{#if data.users}
			<div class="mt-3 flex flex-col gap-2">
				{#each data.users as user}
					{#if getLastType(user)}
						<div class="text-a-accent mb-0 mt-2 text-lg font-semibold brightness-95">
							{event?.title?.includes('Dive Session') ? 'Facilator' : capitalize(user.type)}s
						</div>
					{/if}
					<UserBlock user={{photo: user.photo, ...user}} />
				{/each}
			</div>
		{/if}
	</div>
</Screen>
