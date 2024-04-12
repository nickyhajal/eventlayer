<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import UserAvatar from '$lib/components/UserAvatar.svelte'
import { getAttendeeSearcherContext, getMeContext } from '$lib/state/getContexts'
import { getContext } from 'svelte'

import { getMediaUrl, orderBy, startCase } from '@matterloop/util'

import type { Snapshot } from '../$types.js'

export let data
export const snapshot: Snapshot = {
	capture: () => {
		return {
			q: query,
			scrollY: window.scrollY,
		}
	},
	restore: ({ scrollY, q }) => {
		query = q
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
const usersByType = data.users.reduce((out, user) => {
	if (!out[user.type]) out[user.type] = []
	out[user.type].push(user)
	return out
}, {})
const types = Object.keys(usersByType)
const typeOptions = [
	{ label: 'All Attendees', value: 'all' },
	...types
		.map((type) => ({
			label: type === 'staff' ? 'Staff' : `${startCase(type)}s`,
			value: type,
		}))
		.sort((a, b) => a.label.localeCompare(b.label)),
]
let showType = 'all'
</script>

<Screen
	titleSelectOptions={typeOptions}
	bind:titleSelectValue={showType}
	title="Attendees"
	bigTitle="Attendees"
	bodyClass="bg-slate-100"
>
	<div
		class="topNav sticky z-40 -ml-4 flex w-[calc(100vw+0.25rem)] items-center justify-center border-b border-slate-300/50 bg-slate-50 px-5 text-center text-sm text-slate-600 lg:mx-0 lg:mt-1 lg:w-full lg:rounded-2xl lg:border"
	>
		<input
			type="text"
			class="w-full bg-transparent py-2.5 text-base !outline-none"
			placeholder="Search {typeOptions.find(({value}) => value === showType)?.label.toLowerCase()}..."
			bind:value={query}
		/>
	</div>
	<div class=" relative mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-4 grid grid-cols-1 gap-1.5 py-2 lg:grid-cols-2 lg:gap-4">
			{#each users.filter(({type}) => showType === 'all' || type === showType) as user}
				{@const {id, firstName, lastName, url, bookingUrl, photo, description} = user}
				<div
					class="relative z-0 flex flex-col items-start justify-center rounded-2xl bg-white px-1 py-0 lg:items-center lg:py-4"
				>
					<a href="/user/{id}" class="mb-2 mt-3 flex items-center gap-4 px-2 lg:flex-col">
						<UserAvatar user={user} class="h-12 w-12 lg:mb-2.5 lg:h-20 lg:w-20" />
						<!-- <div
							class="mb-2 h-20 w-20 rounded-full border border-slate-100 bg-slate-50/80 bg-cover bg-center"
							style="background-image: url({})"
						></div> -->
						<div class="font-semibold text-slate-600">{firstName} {lastName}</div>
					</a>
					<div
						class="text-a-accent -mb-3 mt-2.5 hidden h-12 w-full items-center justify-around border-t border-slate-100 font-semibold lg:flex"
					>
						<a href="/user/{id}" class="flex h-full w-1/2 items-center justify-center text-center"
							>View Profile</a
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
