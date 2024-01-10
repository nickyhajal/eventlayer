<script lang="ts">
import { HeroIcon } from '@matterloop/ui'
import { tw } from '@matterloop/util'
import { ChevronLeft } from '@steeze-ui/heroicons'
import { page } from '$app/stores'
import { isDesktop } from '$lib/util/devices'
import { generateBreadcrumbs } from '$lib/util/generateBreadcrumbs'

interface Section {
	title: string
	id: string
	button: Button
}
interface Button {
	label: string
	href: string
}
let className = ''
export let sections: Section[] = []
export let onSectionId = ''
export let basePath = 'settings'
export { className as class }
export let sidebarClass = 'px-3 py-14'
export let columns = 'grid-cols-[16rem_1fr]'
export let getBreadCrumbLabel: (type: string, id: string) => string

$: activeSection = sections.find((section) => section.id === onSectionId)
$: title = activeSection?.title
export function setTitle(newTitle: string) {
	title = newTitle
}

$: breadcrumbs = generateBreadcrumbs($page.url.pathname, getBreadCrumbLabel)
</script>

<div class="max-w-8xl mx-auto w-full pl-[16rem] pt-4">
	<div class="flex h-10 items-center gap-2.5">
		{#if breadcrumbs.length > 1}
			{#each breadcrumbs as { to, label }, i}
				<div class="flex items-center gap-2">
					<a class="text-sm font-normal text-slate-400 hover:text-blue-500" href={to}>{label}</a
					>{#if i !== breadcrumbs.length - 1}<div class="-mt-[2px] text-xs text-slate-400/80">
							/
						</div>{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
<div
	class={`shadow-line max-w-8xl grid overflow-hidden rounded-2xl bg-white ${className} ${
		$isDesktop ? `${columns} mx-auto w-full` : 'mx-2 grid-cols-1'
	}`}
>
	<div
		class={`flex flex-col items-start gap-1 border-r border-slate-200 bg-slate-50 text-left ${sidebarClass}`}
	>
		{#if $$slots.sidebar}
			<slot name="sidebar" />
		{:else}
			{#each sections as { title, id }}
				<a
					href="/{basePath}/{id}"
					class={`w-full rounded-md border border-slate-200/0  px-3 py-2 text-left text-sm transition-all
        ${
					onSectionId === id
						? 'text-green border-slate-300/50 bg-white text-emerald-600 shadow-[0px_2px_3px_rgba(0,0,0,0.04)]'
						: 'bg-slate-50  hover:border-slate-200/50 hover:bg-white'
				}
        `}
					>{title}</a
				>{/each}
		{/if}
	</div>
	{#if $isDesktop}
		{#if activeSection || $page.error}
			<slot />
		{/if}
		{#if $$slots.rightSidebar}
			<slot name="rightSidebar" />
		{/if}
	{/if}
</div>
