<script lang="ts">
	import { page } from '$app/stores'
	import CommandPalette from '$lib/components/command-palette/CommandPalette.svelte'
	import { sidebarLinks } from '$lib/components/command-palette/sidebarLinks'
	import Search from 'lucide-svelte/icons/search'
	import { setContext } from 'svelte'
	import { writable } from 'svelte/store'

	export let data
	$: currPath = $page.url.pathname.replace('/manage', '')
	$: links = sidebarLinks
	let commandPaletteOpen = false
	setContext('venues', writable(data.venues))
</script>

<CommandPalette bind:open={commandPaletteOpen} />

<div class="grid h-full grid-rows-[4.1rem_1fr]">
	<div class="bg-whitefont-semibold grid grid-cols-[15rem_1fr] items-center">
		<div
			class="flex h-full w-full flex-1 items-center border-r-2 border-stone-100 bg-stone-50 px-4 text-center"
		>
			<a
				href="/"
				target="_blank"
				class="w-full rounded-xl bg-stone-200/40 py-3 font-semibold text-stone-600 transition-all hover:bg-stone-200/60"
			>
				{data.event.name}
			</a>
		</div>
		<div class="border-b border-stone-100 px-1.5 py-1.5">
			<button
				type="button"
				on:click={() => (commandPaletteOpen = true)}
				class="font-xl flex w-8/12 items-center gap-2 rounded-md bg-white px-4 py-3 font-medium text-stone-400 transition-all hover:bg-stone-50"
			>
				<Search class="h-4 w-4" />
				<span>Search anything...</span>
				<kbd
					class="ml-auto rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[11px] font-medium text-stone-400"
				>
					⌘K
				</kbd>
			</button>
		</div>
	</div>
	<div class="grid h-full grid-cols-[15em_1fr]">
		<div
			class="flex h-full flex-col gap-0.5 border-r-2 border-stone-100 bg-stone-50 px-2 py-3 text-sm font-medium text-stone-600"
		>
			{#each links as link}
				{#if link.section}
					<div
						class="mt-3 border-t border-stone-200/70 px-2 pt-3 text-[0.7rem] font-semibold uppercase text-stone-600"
					>
						{link.label}
					</div>
				{:else}
					{@const thisBits = link.path.substr(1).split('/')}
					{@const currBits = currPath.substr(1).split('/')}
					<a
						class="flex items-center gap-2 rounded-md px-2 py-2 text-[0.85rem] {thisBits[0] ===
						currBits[0]
							? 'bg-stone-200/50 text-stone-600'
							: 'text-stone-500/80 hover:bg-stone-100'}"
						href="/manage{link.path}"
					>
						{#if link.icon}
							<svelte:component this={link.icon} class="h-4 w-4 {link.iconClass || ''}" />
						{/if}
						<span>{link.label}</span>
					</a>
				{/if}
			{/each}
		</div>
		<div class="bg-white"><slot /></div>
	</div>
</div>
