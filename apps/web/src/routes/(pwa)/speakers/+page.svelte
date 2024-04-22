<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

import { getMediaUrl, orderBy } from '@matterloop/util'

export let data
$: users = orderBy(data.users, ['mainEventUser.type'])
const me = getMeContext()
const typeOptions = [
	{ label: 'All Speakers', value: 'all' },
	{ label: 'Main Stage Speakers', value: 'main-stage-speaker' },
	{ label: 'Showcase Speakers', value: 'showcase-speaker' },
	{ label: 'Facilitator', value: 'attendee' },
]
let showType = 'all'
</script>

<Screen
	title="Speakers"
	bigTitle="Speakers"
	titleSelectOptions={typeOptions}
	bind:titleSelectValue={showType}
	bodyClass="bg-slate-100"
>
	<div class="mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-2 grid grid-cols-2 gap-4 py-2 md:grid-cols-3">
			{#each users.filter(({mainEventUser}) => showType === 'all' || mainEventUser.type === showType) as user}
				{@const {user: {id, firstName, lastName}, media, mainEventUser} = user}
				<a
					href="/user/{mainEventUser.id}"
					class="relative z-0 flex flex-col rounded-2xl bg-white p-1"
				>
					<div
						class="mb-2 h-48 w-full rounded-lg bg-slate-100 bg-cover bg-center"
						style="background-image: url({getMediaUrl(media, `w=256&h=256&func=face&face_margin=60`)})"
					></div>
					<div class="px-2 pb-2">
						<div class="mb-0.5 truncate text-sm font-semibold">{firstName} {lastName}</div>
						<div class="line-clamp-1 text-xs font-semibold text-slate-600">
							{#if mainEventUser.company}
								{mainEventUser.title}, {mainEventUser.company}
							{:else if user.company}
								{mainEventUser.company}
							{:else if user.title}
								{mainEventUser.title}
							{/if}
						</div>
						{#if mainEventUser?.proBio}
							<div class="line-clamp-2 pr-4 text-xs text-stone-600">{mainEventUser?.proBio}</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</div>
</Screen>
