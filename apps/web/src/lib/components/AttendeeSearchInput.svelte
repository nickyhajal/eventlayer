<script lang="ts">
	import * as Popover from '$lib/components/ui/popover'
	import { trpc } from '$lib/trpc/client'

	import type { FullEventUser } from '@matterloop/db'
	import { debounce } from '@matterloop/util'

	import Button from './ui/button/button.svelte'
	import Input from './ui/input/input.svelte'

	let userSearchQuery = ''
	let loading = false
	let showLoading = false
	let loadingTimo = 0
	let error = false
	let lastQuery = ''
	let results: false | any[] = false
	export let handleClick: (user: FullEventUser) => void

	async function searchRaw() {
		if (!loading) {
			loading = true
			clearTimeout(loadingTimo)
			loadingTimo = setTimeout(() => {
				showLoading = true
			}, 800)
			try {
				const res = await trpc().user.search.query({ q: userSearchQuery })
				results = res
				return res
			} catch (e) {
				error = e
			} finally {
				clearTimeout(loadingTimo)
				loading = false
				showLoading = false
			}
		}
	}
	const search = debounce(searchRaw, 200)
	$: {
		if (userSearchQuery !== lastQuery) {
			lastQuery = userSearchQuery
			search()
		}
	}
	function handleBaseClick(user: FullEventUser) {
		handleClick(user)
		userSearchQuery = ''
	}
</script>

<div class="relative flex-grow">
	<Popover.Root disableFocusTrap={true} openFocus={false} closeFocus={false}>
		<Popover.Trigger class="w-full">
			<Input
				name="userSearchQuery"
				class="w-full"
				bind:value={userSearchQuery}
				placeholder="Search People..."
			/>
		</Popover.Trigger>
		<Popover.Content align="end" class="p-1">
			{#if showLoading}
				Loading...
			{:else if results.length}
				<div class="flex flex-col gap-1.5">
					{#each results.slice(0, 12) as user}
						<Button
							on:click={handleBaseClick(user)}
							variant="secondary"
							class="justify-start border-0 bg-white text-left text-sm text-gray-600 shadow-none"
							>{user.firstName} {user.lastName}</Button
						>
					{/each}
				</div>
			{:else if userSearchQuery.length}
				<div class="py-5 text-center text-sm text-gray-600">No results</div>
			{:else}
				<div class="py-5 text-center text-sm text-gray-600">Start typing to search...</div>
			{/if}
		</Popover.Content>
	</Popover.Root>
</div>
