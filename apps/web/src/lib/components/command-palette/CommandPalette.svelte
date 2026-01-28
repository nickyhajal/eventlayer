<script lang="ts">
	import { goto } from '$app/navigation'
	import * as Command from '$lib/components/ui/command'
	import * as Dialog from '$lib/components/ui/dialog'
	import { cn } from '$lib/utils'
	import Loader2 from 'lucide-svelte/icons/loader-2'
	import Search from 'lucide-svelte/icons/search'
	import { onDestroy } from 'svelte'

	import {
		CommandSearchProvider,
		EventSearchProvider,
		PageSearchProvider,
		SidebarSearchProvider,
		SponsorSearchProvider,
		UserSearchProvider,
		VenueSearchProvider,
	} from './providers'
	import type { SearchProvider, SearchResult } from './types'

	export let open = false

	let query = ''
	let results: SearchResult[] = []
	let loading = false
	let debounceTimer: ReturnType<typeof setTimeout>

	const staticProviders: SearchProvider[] = [
		new SidebarSearchProvider(),
		new CommandSearchProvider(),
	]

	const asyncProviders: SearchProvider[] = [
		new UserSearchProvider(),
		new EventSearchProvider(),
		new VenueSearchProvider(),
		new PageSearchProvider(),
		new SponsorSearchProvider(),
	]

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault()
			open = !open
		}
		if (e.key === 'Escape' && open) {
			e.preventDefault()
			open = false
		}
	}

	async function performSearch(q: string) {
		const staticResults = staticProviders.flatMap((provider) =>
			provider.search(q) as SearchResult[],
		)

		if (q.trim().length < 2) {
			results = staticResults
			loading = false
			return
		}

		loading = true
		results = staticResults

		try {
			const asyncResults = await Promise.allSettled(
				asyncProviders.map((provider) => provider.search(q)),
			)

			const fulfilled = asyncResults
				.filter((r): r is PromiseFulfilledResult<SearchResult[]> => r.status === 'fulfilled')
				.flatMap((r) => r.value)

			results = [...staticResults, ...fulfilled].sort((a, b) => a.groupOrder - b.groupOrder)
		} catch {
			// Keep static results on error
		} finally {
			loading = false
		}
	}

	function onQueryChange(q: string) {
		clearTimeout(debounceTimer)
		// Run static search immediately
		const staticResults = staticProviders.flatMap((provider) =>
			provider.search(q) as SearchResult[],
		)
		results = staticResults

		if (q.trim().length < 2) {
			loading = false
			return
		}

		loading = true
		debounceTimer = setTimeout(() => {
			performSearch(q)
		}, 200)
	}

	$: onQueryChange(query)

	$: if (!open) {
		query = ''
		results = []
		loading = false
	}

	$: if (open && !query) {
		// Show defaults when opened
		performSearch('')
	}

	function handleSelect(result: SearchResult) {
		open = false
		if (result.action) {
			result.action()
		} else if (result.href) {
			goto(result.href)
		}
	}

	$: groupedResults = results.reduce(
		(acc, result) => {
			if (!acc[result.group]) {
				acc[result.group] = { results: [], order: result.groupOrder }
			}
			acc[result.group].results.push(result)
			return acc
		},
		{} as Record<string, { results: SearchResult[]; order: number }>,
	)

	$: sortedGroups = Object.entries(groupedResults).sort(([, a], [, b]) => a.order - b.order)

	onDestroy(() => {
		clearTimeout(debounceTimer)
	})
</script>

<svelte:window on:keydown={handleKeydown} />

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
		/>
		<div
			class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
			role="presentation"
			on:pointerdown|self={() => (open = false)}
		>
			<Command.Command
				class="w-full max-w-[560px] rounded-xl border border-stone-200 bg-white shadow-2xl"
				shouldFilter={false}
			>
				<div class="flex items-center border-b border-stone-100 px-4" data-cmdk-input-wrapper="">
					<Search class="mr-3 h-5 w-5 shrink-0 text-stone-400" />
					<Command.CommandInput
						placeholder="Search anything..."
						class="flex h-14 w-full bg-transparent text-base outline-none placeholder:text-stone-400 disabled:cursor-not-allowed disabled:opacity-50"
						bind:value={query}
					/>
					{#if loading}
						<Loader2 class="ml-2 h-4 w-4 shrink-0 animate-spin text-stone-400" />
					{/if}
					<kbd
						class="ml-2 hidden shrink-0 rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium text-stone-400 sm:inline-block"
					>
						ESC
					</kbd>
				</div>

				<Command.CommandList class="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
					{#if sortedGroups.length === 0 && !loading}
						<Command.CommandEmpty class="py-12 text-center text-sm text-stone-400">
							No results found.
						</Command.CommandEmpty>
					{/if}

					{#each sortedGroups as [groupName, group] (groupName)}
						<Command.CommandGroup
							heading={groupName}
							class="[&_[data-cmdk-group-heading]]:px-2 [&_[data-cmdk-group-heading]]:py-2 [&_[data-cmdk-group-heading]]:text-[11px] [&_[data-cmdk-group-heading]]:font-semibold [&_[data-cmdk-group-heading]]:uppercase [&_[data-cmdk-group-heading]]:tracking-wide [&_[data-cmdk-group-heading]]:text-stone-400"
						>
							{#each group.results as result (result.id)}
								<Command.CommandItem
									class="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm aria-selected:bg-stone-100"
									value={result.id}
									onSelect={() => handleSelect(result)}
								>
									{#if result.avatarUrl}
										<img
											src={result.avatarUrl}
											alt=""
											class={cn(
												'h-8 w-8 shrink-0 object-cover',
												result.group === 'People' ? 'rounded-full' : 'rounded-md',
											)}
										/>
									{:else if result.avatarFallback}
										<div
											class={cn(
												'flex h-8 w-8 shrink-0 items-center justify-center bg-stone-100 text-xs font-medium text-stone-500',
												result.group === 'People' ? 'rounded-full' : 'rounded-md',
											)}
										>
											{result.avatarFallback}
										</div>
									{:else if result.icon}
										<div
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-stone-500"
										>
											<svelte:component this={result.icon} class="h-4 w-4" />
										</div>
									{/if}

									<div class="flex min-w-0 flex-1 flex-col">
										<span class="truncate font-medium text-stone-700">{result.label}</span>
										{#if result.sublabel}
											<span class="truncate text-xs text-stone-400">{result.sublabel}</span>
										{/if}
									</div>
								</Command.CommandItem>
							{/each}
						</Command.CommandGroup>
					{/each}
				</Command.CommandList>

				{#if query.trim().length > 0}
					<div class="border-t border-stone-100 px-4 py-2.5">
						<div class="flex items-center gap-4 text-[11px] text-stone-400">
							<span class="flex items-center gap-1">
								<kbd class="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono">↑↓</kbd>
								navigate
							</span>
							<span class="flex items-center gap-1">
								<kbd class="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono">↵</kbd>
								select
							</span>
							<span class="flex items-center gap-1">
								<kbd class="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono">esc</kbd>
								close
							</span>
						</div>
					</div>
				{/if}
			</Command.Command>
		</div>
	</Dialog.Portal>
</Dialog.Root>
