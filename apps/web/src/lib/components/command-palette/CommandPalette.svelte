<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import * as Command from '$lib/components/ui/command'
	import * as Dialog from '$lib/components/ui/dialog'
	import { cn } from '$lib/utils'
	import Search from 'lucide-svelte/icons/search'
	import { onDestroy } from 'svelte'

	import { CommandSearchProvider } from './providers/CommandSearchProvider'
	import { ContextualSearchProvider } from './providers/ContextualSearchProvider'
	import { SidebarSearchProvider } from './providers/SidebarSearchProvider'
	import { UnifiedSearchProvider } from './providers/UnifiedSearchProvider'
	import type { SearchProvider, SearchResult } from './types'

	export let open = false

	let query = ''
	let results: SearchResult[] = []
	let loading = false
	let debounceTimer: ReturnType<typeof setTimeout>

	const contextualProvider = new ContextualSearchProvider($page.url.pathname)
	const staticProviders: SearchProvider[] = [
		contextualProvider,
		new SidebarSearchProvider(),
		new CommandSearchProvider(),
	]
	const unifiedProvider = new UnifiedSearchProvider()

	// Keep contextual provider in sync with current route
	$: contextualProvider.updatePath($page.url.pathname)

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
		const staticResults = staticProviders.flatMap(
			(provider) => provider.search(q) as SearchResult[],
		)

		if (q.trim().length < 2) {
			results = staticResults
			loading = false
			return
		}

		loading = true
		results = staticResults

		try {
			const asyncResults = await unifiedProvider.search(q)
			results = [...staticResults, ...asyncResults].sort((a, b) => a.groupOrder - b.groupOrder)
		} catch {
			// Keep static results on error
		} finally {
			loading = false
		}
	}

	function onQueryChange(q: string) {
		clearTimeout(debounceTimer)
		const staticResults = staticProviders.flatMap(
			(provider) => provider.search(q) as SearchResult[],
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

	// Skeleton widths seeded once (not re-randomized on every render)
	const skeletonWidths = [
		{ label: 72, sub: 48 },
		{ label: 56, sub: 36 },
		{ label: 84, sub: 52 },
		{ label: 64, sub: 44 },
		{ label: 76, sub: 40 },
	]

	onDestroy(() => {
		clearTimeout(debounceTimer)
	})
</script>

<svelte:window on:keydown={handleKeydown} />

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
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
					<kbd
						class="ml-2 hidden shrink-0 rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium text-stone-400 sm:inline-block"
					>
						ESC
					</kbd>
				</div>

				<Command.CommandList class="max-h-[400px] overflow-y-auto overflow-x-hidden p-2">
					{#if sortedGroups.length > 0}
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
					{/if}

					{#if loading && query.trim().length >= 2}
						<!-- Skeleton loading rows for async results -->
						<div class="mt-1">
							{#each [{ count: 3 }, { count: 2 }] as skeleton, gi}
								<div class="px-2 py-2">
									<div
										class="h-2.5 animate-pulse rounded bg-stone-100"
										style="width: {gi === 0 ? 52 : 40}px"
									/>
								</div>
								{#each Array(skeleton.count) as _, i}
									{@const widths = skeletonWidths[gi * 3 + i] || skeletonWidths[0]}
									<div class="flex items-center gap-3 px-2.5 py-2.5">
										<div
											class="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-stone-100"
										/>
										<div class="flex flex-1 flex-col gap-1.5">
											<div
												class="h-3.5 animate-pulse rounded bg-stone-100"
												style="width: {widths.label}%"
											/>
											<div
												class="h-2.5 animate-pulse rounded bg-stone-50"
												style="width: {widths.sub}%"
											/>
										</div>
									</div>
								{/each}
							{/each}
						</div>
					{:else if sortedGroups.length === 0 && !loading && query.trim().length > 0}
						<Command.CommandEmpty class="py-12 text-center text-sm text-stone-400">
							No results found.
						</Command.CommandEmpty>
					{/if}
				</Command.CommandList>

				{#if query.trim().length > 0}
					<div class="border-t border-stone-100 px-4 py-2.5">
						<div class="flex items-center gap-4 text-[11px] text-stone-400">
							<span class="flex items-center gap-1">
								<kbd class="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono"
									>↑↓</kbd
								>
								navigate
							</span>
							<span class="flex items-center gap-1">
								<kbd class="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono"
									>↵</kbd
								>
								select
							</span>
							<span class="flex items-center gap-1">
								<kbd class="rounded border border-stone-200 bg-stone-50 px-1 py-0.5 font-mono"
									>esc</kbd
								>
								close
							</span>
						</div>
					</div>
				{/if}
			</Command.Command>
		</div>
	</Dialog.Portal>
</Dialog.Root>
