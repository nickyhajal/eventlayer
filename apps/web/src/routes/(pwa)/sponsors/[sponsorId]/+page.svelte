<script lang="ts">
	import EventRow from '$lib/components/EventRow.svelte'
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import VenueBlock from '$lib/components/VenueBlock.svelte'
	import { getMeContext } from '$lib/state/getContexts'

	import type { Event } from '@matterloop/db'
	import { Markdown } from '@matterloop/ui'
	import { dayjs, getMediaUrl } from '@matterloop/util'

	export let data
	$: sponsor = data.sponsor
</script>

<Screen title={sponsor.title} back="/sponsors">
	<div class="mx-auto max-w-7xl py-6">
		<div class="flex flex-col items-center justify-start gap-2 pb-6">
			<div
				class="mb-16 flex items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-8"
			>
				<img
					src={getMediaUrl(sponsor.photo, 'w-780')}
					class=" w-80"
					alt={`Photo of ${sponsor.title}`}
				/>
			</div>
			<div class="flex flex-grow flex-col items-start">
				<div class="w-fell flex-grow pb-0 text-left text-2xl font-bold xs:text-3xl">
					{sponsor.title}
				</div>
			</div>
		</div>
		{#if sponsor?.url}
			<Button
				href={sponsor.url}
				target="_blank"
				rel="noopener noreferrer"
				class="-mt-2 mb-4 h-9 w-full rounded-lg bg-sky-700 text-sm"
			>
				View Website
			</Button>
		{/if}
		{#if sponsor.users.length}
			<div class="mt-4 gap-1 rounded-lg bg-blue-50/50 p-2">
				<div class="text-sm font-semibold text-slate-500">Reps Attending</div>
				<div class="mt-1 flex flex-wrap gap-1">
					{#each sponsor.users as { id, user }}
						<a
							href={`/sponsors/${id}`}
							class="flex w-fit items-center rounded-lg border border-b-2 border-slate-100 bg-white px-2 py-1 text-sm font-medium text-slate-700"
						>
							<img
								src={getMediaUrl(user?.photo)}
								class="flex-0 mr-1 h-6 w-6 rounded-full object-cover"
							/>
							{user?.firstName}
							{user?.lastName}
						</a>
					{/each}
				</div>
			</div>
		{/if}
		{#if sponsor?.description}
			<Markdown class="pr-4 pt-4 text-slate-600" data={sponsor?.description} />
		{/if}
	</div>
</Screen>
