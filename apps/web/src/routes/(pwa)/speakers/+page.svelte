<script lang="ts">
	import Screen from '$lib/components/Screen.svelte'
	import { getMeContext } from '$lib/state/getContexts'

	import { getMediaUrl, orderBy, startCase } from '@matterloop/util'

	export let data
	$: users = orderBy(data.users, ['mainEventUser.type'])
	const me = getMeContext()
	const typeOptions = [
		{ label: 'All Speakers', value: 'all' },
		{ label: 'Main Stage Speakers', value: 'main-stage-speaker' },
		{ label: 'On Stage Hosts', value: 'on-stage-host' },
		// { label: 'Facilitator', value: 'attendee' },
	]
	let showType = 'all'
	const vals = {
		'main-stage-speaker': 1,
		'on-stage-host': 2,
		// facilitator: 3,
	}
	$: ordered = orderBy(
		users.map((user) =>
			!['main-stage-speaker', 'on-stage-host'].includes(user.mainEventUser.type)
				? { ...user, mainEventUser: { ...user.mainEventUser, type: 'facilitator' } }
				: user,
		),
		[({ mainEventUser }) => vals[mainEventUser.type] || Infinity],
		['asc'],
	)
</script>

<Screen
	title="Speakers"
	bigTitle="Speakers"
	titleSelectOptions={typeOptions}
	bind:titleSelectValue={showType}
	bodyClass="bg-slate-100"
>
	<div class="mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mb-8 max-w-2xl mt-16 px-4 sm:px-0"></div>
		<div class="mt-2 grid grid-cols-2 gap-1.5 py-2 md:grid-cols-3 md:gap-4">
			{#each ordered.filter(({ mainEventUser, media }) => media && (showType === 'all' || mainEventUser.type === showType)) as user}
				{@const {
					user: { id, firstName, lastName },
					media,
					mainEventUser,
				} = user}
				<a
					href="/user/{mainEventUser.id}"
					class="relative z-0 flex flex-col overflow-hidden rounded-xl border border-b-2 border-slate-400/20 bg-white p-0"
				>
					<div
						class="mb-2 h-48 w-full rounded-t-lg bg-slate-100 bg-cover bg-center"
						style="background-image: url({getMediaUrl(
							media,
							`w=256&h=256&func=face&face_margin=60`,
						)})"
					></div>
					<div class="px-2.5 pb-1.5 pt-1">
						<div class="pb-1 text-xs font-semibold text-slate-500/80">
							{startCase(mainEventUser.type?.replace('-speaker', ''))}
						</div>
						<div class=" truncate font-semibold text-[1.0.5rem] text-slate-800">
							{firstName}
							{lastName}
						</div>
						{#if mainEventUser.company || mainEventUser.title || user.title}
							<div class="truncate pb-2.5 text-xs font-semibold text-slate-500">
								{#if mainEventUser.company}
									{mainEventUser.title}, {mainEventUser.company}
								{:else if user.company}
									{mainEventUser.company}
								{:else if user.title}
									{mainEventUser.title}
								{/if}
							</div>
						{/if}
						{#if mainEventUser?.proBio}
							<div class="mb-1.5 line-clamp-2 text-xs font-medium text-slate-500">
								{mainEventUser?.proBio}
							</div>
						{/if}
						{#if !(mainEventUser?.proBio || mainEventUser.company || mainEventUser.title || user.title)}
							<div class="pt-2"></div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</div>
</Screen>
