<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation'
	import UserAvatar from '$lib/components/UserAvatar.svelte'
	import { getAttendeeSearcherContext } from '$lib/state/getContexts'
	import { trpc } from '$lib/trpc/client'
	import Check from 'lucide-svelte/icons/check-circle'
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'
	import { set } from 'zod'

	import { dayjs, orderBy, startCase } from '@matterloop/util'

	const searcher = getAttendeeSearcherContext()
	export let data
	let checkins = writable(new Set(data.stats.checkedInIds))
	let stats = writable(data.stats)
	let query = ''
	let saving: string | false = false
	let users = data.users
	let error = ''
	let timo = 0
	let searchInput: HTMLInputElement | null = null
	let updateTimo = 0
	let updateSeconds = 30
	let nextUpdate = dayjs()
	let nextUpdateStr = ''
	$: stats.set(data.stats)
	$: {
		if (query) {
			$searcher.query(query)?.then((res) => {
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
	onMount(() => {
		checkTimeToUpdate()
	})
	function checkTimeToUpdate() {
		clearTimeout(updateTimo)
		let nextUpdateSeconds = Math.max(dayjs(nextUpdate).diff(dayjs(), 'seconds'), 0)
		nextUpdateStr = `${nextUpdateSeconds}`
		if (nextUpdateStr <= 0) {
			nextUpdate = dayjs().add(updateSeconds + 2, 'seconds')
			invalidateAll()
		}
		updateTimo = setTimeout(() => {
			checkTimeToUpdate()
		}, 1000)
	}
	async function toggleCheckin(userId: string) {
		if (saving) return
		saving = userId
		try {
			const res = await trpc().checkin.toggle.mutate({ userId })
			if (res.change.status === 'removed') {
				$checkins.delete(userId)
			} else {
				$checkins.add(userId)
			}
			checkins.set(new Set([...$checkins]))
			stats.set(data.stats)
		} catch (e) {
			error = e.message
		} finally {
			saving = false
		}
	}
</script>

<div
	class=" w-full border-b border-stone-200/50 bg-stone-50 py-2 text-center text-sm font-semibold text-stone-500"
>
	{data.event.name} Check In
</div>
<div class="mx-auto max-w-md px-1.5">
	<input
		type="text"
		bind:value={query}
		bind:this={searchInput}
		placeholder="Search {users.length} Attendees..."
		class="my-3 w-full rounded-xl bg-stone-200/30 py-3 text-center"
	/>
	{#if !query}
		<div class="mx-auto grid w-9/12 grid-cols-[1fr_5.2rem] gap-4 gap-x-8 pt-10 text-sm">
			<div class="text-right font-semibold">Checkin Count</div>
			<div>{$stats.checkedInIds.length}</div>
			<div class="text-right font-semibold">Total Attendees</div>
			<div>{users.length}</div>
			<div class="text-right font-semibold">Next Data Update</div>
			<div>{nextUpdateStr}</div>
		</div>
	{:else}
		{#each users as user}
			{@const { id, firstName, lastName, type, url, bookingUrl, photo, description } = user}
			{@const isCheckedIn = $checkins.has(id)}
			<div
				class="relative z-0 flex items-center justify-between rounded-2xl bg-white px-4 py-3 even:bg-stone-50"
			>
				<div class="flex items-center gap-2">
					<UserAvatar {user} class="h-8 w-8 " />
					<div class="flex flex-col">
						<div class="text-sm font-semibold text-slate-600">{firstName} {lastName}</div>
						{#if type}
							<div class="text-xs text-slate-500">{type ? startCase(type) : ''}</div>
						{/if}
					</div>
				</div>
				{#if isCheckedIn}
					<button
						on:click={() => toggleCheckin(id)}
						class="flex h-full items-center justify-center rounded-lg border border-b-2 border-emerald-300/50 bg-emerald-300/20 px-3 py-2 text-center text-sm font-medium text-emerald-800/80 saturate-[0.8]"
						>{#if saving === id}
							<span>Saving...</span>
						{:else}
							<Check class="h-5 w-6" />{/if}</button
					>
				{:else}
					<button
						on:click={() => toggleCheckin(id)}
						class="flex h-full items-center justify-center rounded-lg border border-b-2 border-stone-300/40 bg-stone-300/30 px-3 py-2 text-center text-sm font-medium text-stone-800/80"
						>{saving === id ? 'Saving...' : 'Check In'}</button
					>
				{/if}
			</div>
		{/each}
		{#if query.length > 0}
			<button
				on:click={() => {
					query = ''
					searchInput?.focus()
				}}
				class="mt-8 flex h-full w-full items-center justify-center rounded-lg border border-b-2 border-stone-300/10 bg-stone-300/20 px-3 py-2 text-center text-sm font-medium text-stone-800/80"
				>Clear Search</button
			>
		{/if}
	{/if}
</div>
