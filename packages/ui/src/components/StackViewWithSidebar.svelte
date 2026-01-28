<script lang="ts">
	import { ChevronLeft } from '@steeze-ui/heroicons'
	import { page } from '$app/stores'
	import { isDesktop } from '$lib/core/stores'
	import { tw } from '$lib/tw'

	import { HeroIcon } from '@matterloop/ui'

	interface Section {
		title: string
		id: string
	}
	let className = ''
	export let sections: Section[] = []
	export let onSectionId = ''
	export let basePath = 'settings'
	export { className as class }
	export let bodyClass = 'px-8 py-10'
	export let sidebarClass = 'px-3 py-14'
	export let columns = 'grid-cols-[16rem_1fr]'
	export let hasBodyHeader = true

	$: activeSection = sections.find((section) => section.id === onSectionId)
	$: title = activeSection?.title
	export function setTitle(newTitle: string) {
		title = newTitle
	}
</script>

<div
	class={`max-w-8xl mt-10 grid overflow-hidden rounded-2xl bg-white ${className} ${
		$isDesktop ? `${columns} mx-auto w-full` : 'mx-2 grid-cols-1'
	}`}
>
	<div
		class={`flex flex-col items-start gap-1 border-r border-gray-600 bg-gray-200 text-left ${sidebarClass}`}
	>
		{#if $$slots.sidebar}
			<slot name="sidebar" />
		{:else}
			{#each sections as { title, id }}
				<a
					href="/{basePath}/{id}"
					class={`w-full rounded-md border border-gray-200 bg-gray-200 px-3 py-2 text-left text-sm transition-all
        ${
					onSectionId === id
						? 'text-green border-gray-600/60 bg-white shadow-[0px_2px_3px_rgba(0,0,0,0.04)]'
						: 'hover:border-gray-600/60 hover:bg-white'
				}
        `}>{title}</a
				>{/each}
		{/if}
	</div>
	{#if $isDesktop}
		<div class="grid overflow-hidden" class:grid-rows-[3.7rem_1fr]={hasBodyHeader}>
			{#if activeSection || $page.error}
				{#if hasBodyHeader}
					<div
						class="flex w-full border-b border-gray-600 py-4 text-left text-xl font-semibold text-gray-900"
					>
						<div class="px-0">
							<HeroIcon src={ChevronLeft} class="w-5 opacity-0" />
						</div>
						<div class="font-semibold">{activeSection?.title || ''}</div>
					</div>
				{/if}
				<div class={tw(`grow px-8 py-10 ${bodyClass}`)}>
					<slot />
				</div>
			{/if}
		</div>
		{#if $$slots.rightSidebar}
			<slot name="rightSidebar" />
		{/if}
	{/if}
</div>
