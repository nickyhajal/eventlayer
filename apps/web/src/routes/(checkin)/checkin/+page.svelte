<script lang="ts">
import { invalidate, invalidateAll } from '$app/navigation'
import UserAvatar from '$lib/components/UserAvatar.svelte'
import { getAttendeeSearcherContext } from '$lib/state/getContexts'
import { trpc } from '$lib/trpc/client'
import Check from 'lucide-svelte/icons/check-circle'
import { writable } from 'svelte/store'

import { orderBy } from '@matterloop/util'

const searcher = getAttendeeSearcherContext()
export let data
let checkins = writable(new Set(data.stats.checkedInIds))
let query = ''
let saving = false
let users = data.users
let error = ''
$: {
	if (query) {
		$searcher(query)?.then((res) => {
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
	} catch (e) {
		error = e.message
	} finally {
		saving = false
	}

	// invalidateAll()
}
</script>

<div
	class=" w-full border-b border-stone-200/50 bg-stone-50 py-2 text-center text-sm font-semibold text-stone-500"
>
	{data.event.name} Check In
</div>
<div class="mx-auto max-w-md px-1">
	<input
		type="text"
		bind:value={query}
		placeholder="Search {users.length} Attendees..."
		class="my-3 w-full rounded-xl bg-stone-200/30 py-3 text-center"
	/>
	{#each users as user}
		{@const {id, firstName, lastName, url, bookingUrl, photo, description} = user}
		{@const isCheckedIn = $checkins.has(id)}
		<div
			class="relative z-0 flex items-center justify-between rounded-2xl bg-white px-4 py-3 even:bg-stone-50"
		>
			<div class="flex items-center gap-2">
				<UserAvatar user={user} class="h-8 w-8 " />
				<div class="text-sm font-medium text-slate-600">{firstName} {lastName}</div>
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
</div>
