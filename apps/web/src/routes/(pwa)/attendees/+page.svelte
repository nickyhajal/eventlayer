<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getAttendeeSearcherContext, getMeContext } from '$lib/state/getContexts'
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
let query = ''
const me = getMeContext()
const seed = getContext<number>('seed')
const searcher = getAttendeeSearcherContext()
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
let users: typeof data.users = []
$: {
	if (query) {
		$searcher(query).then((res) => {
			users = res
		})
	} else {
		users =
			typeof window !== 'undefined'
				? orderBy(
						data.users.map((user) => ({ ...user, nameLower: user.lastName.toLowerCase() })),
						['nameLower'],
					)
				: []
	}
}
</script>

<Screen title="Attendees" bigTitle="Attendees" bodyClass="bg-slate-100">
	<div
		class="topNav sticky z-40 flex items-center justify-center border-b border-slate-300/50 bg-slate-50 px-4 text-center text-sm text-slate-600 lg:mt-1 lg:rounded-2xl lg:border"
	>
		<input
			type="text"
			class="bg-transparent py-2.5"
			placeholder="Search attendees..."
			bind:value={query}
		/>
	</div>
	<div class="container relative mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-2 grid grid-cols-1 gap-4 py-2 lg:grid-cols-2">
			{#each users as user}
				{@const {id, firstName, lastName, url, bookingUrl, photo, description} = user}
				<div
					class="relative z-0 flex flex-col items-center justify-center rounded-2xl bg-white px-1 py-4"
				>
					<a href={url} target="_blank" class="mb-2 flex flex-col items-center">
						<div
							class="mb-2 h-20 w-20 rounded-full border border-slate-100 bg-slate-50/80 bg-cover bg-center"
							style="background-image: url({getMediaUrl(photo)})"
						></div>
						<div class="font-semibold text-slate-600">{firstName} {lastName}</div>
					</a>
					<div
						class="text-main mt-2 flex h-12 w-full items-center justify-around border-t border-slate-100 font-semibold"
					>
						<a
							href={url}
							target="_blank"
							class="flex h-full w-1/2 items-center justify-center text-center">View Profile</a
						>
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
