<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getMeContext } from '$lib/state/getContexts'
import ChevronRight from 'lucide-svelte/icons/chevron-right'
import { getContext } from 'svelte'

import { getMediaUrl, orderBy } from '@matterloop/util'

import type { Snapshot } from '../$types.js'

export let data
export const snapshot: Snapshot = {
	capture: () => {
		return {
			scrollY: window.scrollY,
		}
	},
	restore: ({ scrollY }) => {
		window.scrollTo(0, scrollY)
	},
}
const me = getMeContext()
const seed = getContext<number>('seed')
function shuffle(array: Array<any>, seed: number) {
	let currentIndex = array.length,
		temporaryValue,
		randomIndex
	seed = seed || 1
	let random = function () {
		var x = Math.sin(seed++) * 10000
		return x - Math.floor(x)
	}
	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(random() * currentIndex)
		currentIndex -= 1
		// And swap it with the current element.
		temporaryValue = array[currentIndex]
		array[currentIndex] = array[randomIndex]
		array[randomIndex] = temporaryValue
	}
	return array
}
$: sponsors =
	typeof window !== 'undefined'
		? orderBy(
				data.sponsors.map((sponsor) => ({ ...sponsor, nameLower: sponsor.title.toLowerCase() })),
				['nameLower'],
			)
		: []
</script>

<Screen title="Sponsors" bigTitle="Sponsors" bodyClass="bg-slate-100">
	<div
		class="topNav sticky z-40 flex items-center justify-center border-b border-slate-300/50 bg-slate-50 px-4 py-2 text-center text-sm text-slate-600 lg:mt-1 lg:rounded-2xl lg:border"
	>
		<Button
			variant="outline"
			class="text-main mt-0 grid w-full grid-cols-[1fr_0.7rem] items-center justify-center bg-white"
			href="/sponsors/map"
		>
			<div>View Sponsor Map</div>
			<ChevronRight class="text-main relative -top-[1px] h-5 w-5" />
		</Button>
	</div>
	<div class="container relative mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-2 grid grid-cols-1 gap-4 py-2 lg:grid-cols-2">
			{#each sponsors as sponsor}
				{@const {id, title, url, bookingUrl, photo, description} = sponsor}
				<div class="relative z-0 flex flex-col rounded-2xl bg-white p-1">
					<a href={url} target="_blank">
						<div
							class="mb-2 h-48 w-full rounded-xl border border-slate-100 bg-slate-50/80 bg-cover bg-center"
							style="background-image: url({getMediaUrl(photo)})"
						></div>
					</a>
					<div class="px-2 pb-2">
						<div class="mb-0.5 truncate text-lg font-semibold">{title}</div>
						<div class="line-clamp mb-0.5 truncate text-sm font-medium text-slate-600">
							{description}
						</div>
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
					</div>
					<div
						class="text-main mt-2 flex h-12 w-full items-center justify-around border-t border-slate-100 font-semibold"
					>
						{#if url}
							<a
								href={url}
								target="_blank"
								class="flex h-full w-1/2 items-center justify-center border-r border-slate-100 text-center"
								>View Profile</a
							>
						{/if}
						{#if bookingUrl}
							<a
								href={bookingUrl}
								target="_blank"
								class="flex h-full w-1/2 items-center justify-center text-center">Contact Sponsor</a
							>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</Screen>

<style lang="postcss">
.topNav {
	/* top: 3rem; */
	top: calc((env(safe-area-inset-top) * 0.68) + 3rem);
	@media screen and (min-width: 1024px) {
		top: 0.5rem;
	}
}
</style>
