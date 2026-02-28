<script lang="ts">
	import Screen from '$lib/components/Screen.svelte'
	import UserAvatar from '$lib/components/UserAvatar.svelte'
	import { getAttendeeSearcherContext, getMeContext } from '$lib/state/getContexts'
	import { getContext, onMount } from 'svelte'

	import type { User } from '@matterloop/db'
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
	const searcher = getAttendeeSearcherContext()
	let allUsers: User[] = []
	let users: User[] = []
	let userStore = $searcher.store
	allUsers = $userStore.attendees
	$: if ($searcher && !allUsers.length) {
		userStore = $searcher.store
		allUsers = $userStore.attendees
		// console.log('search', $searcher)
		// allUsers = $userStore
		// $searcher('')?.then((res) => {
		// 	allUsers = res
		// })
	}
	$: {
		if (query) {
			$searcher.query(query).then((res) => {
				users = res
			})
		} else {
			users =
				typeof window !== 'undefined'
					? orderBy(
							allUsers.map((user) => ({ ...user, nameLower: user.lastName.toLowerCase() })),
							['nameLower'],
						)
					: []
		}
	}
	const usersByType = allUsers.reduce((out, user) => {
		if (!out[user.type]) out[user.type] = []
		out[user.type].push(user)
		return out
	}, {})
	const types = Object.keys(usersByType)
	const typeOptions = [
		{ label: 'All Attendees', value: 'all' },
		{ label: 'My Friends', value: 'my-friends' },
		{ label: 'Friended Me', value: 'friended-me' },
		...types
			.map((type) => ({
				label: type === 'staff' ? 'Staff' : `${startCase(type)}s`,
				value: type,
			}))
			.sort((a, b) => a.label.localeCompare(b.label)),
	]
	let showType = 'all'

	/**
	 * Sorts users by whether they have a mediaId (users with mediaId come first),
	 * then by lastName, and finally by firstName
	 * @param users - Array of User objects to sort
	 * @returns Sorted array of User objects
	 */
	function sortUsers(users: User[]) {
		return [...users].sort((a, b) => {
			// First sort by whether mediaId exists (non-null mediaId comes first)
			if (a.mediaId !== null && b.mediaId === null) return -1
			if (a.mediaId === null && b.mediaId !== null) return 1

			// Then sort by lastName
			const lastNameComparison = a.lastName.toLowerCase().localeCompare(b.lastName.toLowerCase())
			if (lastNameComparison !== 0) return lastNameComparison

			// Finally sort by firstName
			return a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase())
		})
	}
	function filterUsers(users: User[], showType: string) {
		if (showType === 'my-friends') {
			return users.filter((user) => data.me.connectionsTo.some((c) => c.toId === user.id))
		}
		if (showType === 'friended-me') {
			return users.filter((user) => data.me.connectionsFrom.some((c) => c.fromId === user.userId))
		}
		return users.filter((user) => showType === 'all' || user.type === showType)
	}
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
			placeholder="Search {typeOptions
				.find(({ value }) => value === showType)
				?.label.toLowerCase()}..."
			bind:value={query}
		/>
	</div>
	<div class=" relative mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-4 grid grid-cols-1 gap-1.5 py-2 lg:grid-cols-2 lg:gap-4">
			{#each sortUsers(filterUsers(users, showType)) as user}
				{@const { id, firstName, lastName, url, bookingUrl, photo, description } = user}
				<div
					class="relative z-0 flex flex-col items-start justify-center rounded-2xl bg-white px-1 py-0 lg:items-center lg:py-4"
				>
					<a href="/user/{id}" class="mb-2 mt-3 flex items-center gap-4 px-2 lg:flex-col">
						<UserAvatar {user} class="h-12 w-12 lg:mb-2.5 lg:h-20 lg:w-20" />
						<!-- <div
							class="mb-2 h-20 w-20 rounded-full border border-slate-100 bg-slate-50/80 bg-cover bg-center"
							style="background-image: url({})"
						></div> -->
						<div class="font-semibold text-slate-600">{firstName}&nbsp;{lastName}</div>
					</a>
					<div
						class="-mb-3 mt-2.5 hidden h-12 w-full items-center justify-around border-t border-slate-100 font-semibold text-a-accent lg:flex"
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
