<script lang="ts">
import * as Popover from '$lib/components/ui/popover'
import { getMediaUrl } from '$lib/util/getMediaUrl'
import ChevronDown from 'lucide-svelte/icons/chevron-down'
import ChevronLeft from 'lucide-svelte/icons/chevron-left'
import { fade } from 'svelte/transition'

import type { Media } from '@matterloop/db'
import { tw } from '@matterloop/ui'

import Button from './ui/button/button.svelte'

export let title = ''
export let bigTitle = ''
export let back = ''
export let noBgScreen = false
export let photo: Media
export let bodyClass = ''
export let titleSelectOptions: false | Array<{ label: string; value: string }> = false
export let titleSelectValue: string = ''
export let preferHistoryBack = true
let titleSelectOpen = false
let titleSelectMobileOpen = false
let contentElm: HTMLDivElement
let bigTitleOpacity = 1
let mainTitleOpacity = bigTitle ? 0 : 1

function handleContentScroll(e) {
	const scrollY = e.currentTarget === contentElm ? contentElm.scrollTop : window.scrollY
	if (bigTitle) {
		if (scrollY > 0) {
			titleSelectOpen = false
			bigTitleOpacity = (100 - scrollY * 4) / 100
			mainTitleOpacity = (scrollY * 4) / 100
		} else {
			mainTitleOpacity = 0
			bigTitleOpacity = 1
		}
	}
}
function handleBack(e: MouseEvent) {
	if (preferHistoryBack) {
		if (window.history.length) {
			e.stopPropagation()
			e.preventDefault()
			window.history.back()
		}
	}
}
</script>

<svelte:window on:scroll={handleContentScroll} />

<!-- main shell -->
<div
	class="relative mx-auto h-full min-h-[40dvh] {bigTitle ? 'bg-white' : 'bg-white'} pt-12 lg:pt-0"
>
	<!-- bottom extra blue -->
	{#if !noBgScreen}
		<div class="fixed top-0 z-10 block h-64 w-full bg-slate-800 lg:hidden"></div>
	{/if}

	<!-- title bar -->
	<div
		class="topControls fixed top-0 z-50 flex h-12 w-full items-center justify-between bg-slate-800 py-2 lg:relative lg:hidden"
		style="--tw-bg-opacity: {photo ? mainTitleOpacity : 1}"
	>
		<!-- back button -->
		<div>
			{#if back}
				<div transition:fade>
					<Button
						on:click={(e) => handleBack(e)}
						variant="ghost"
						href={back}
						class="px-1 hover:bg-transparent"
					>
						<ChevronLeft class="h-8 w-8 px-0 text-white hover:bg-transparent"></ChevronLeft>
					</Button>
				</div>
			{/if}
		</div>
		<div
			class="absolute left-0 right-0 mx-auto w-fit max-w-56 truncate text-center text-sm font-semibold text-white"
			style="opacity: {mainTitleOpacity}"
		>
			{titleSelectOptions ?  titleSelectOptions.find(({value}) => value === titleSelectValue)?.label || title : title}
		</div>
	</div>

	<!-- content -->
	<div
		class={tw(`contentShell relative z-20 -mt-0.5 h-full bg-white pb-6 lg:px-16   ${photo ? '-mt-16' : ''} ${bodyClass}`)}
		bind:this={contentElm}
		on:scroll={handleContentScroll}
	>
		<div class=" lg:ml-16 lg:max-w-3xl">
			<!-- bigTitle-->
			{#if bigTitle}
				<div
					class="bigTitle relative -top-0.5 flex w-full items-center justify-center bg-slate-800 bg-cover py-2 lg:hidden {photo ? 'h-64' : 'h-fit'}"
					style="background-image: url({getMediaUrl(photo)})"
				>
					{#if photo}
						<div class="absolute top-0 h-24 w-full bg-gradient-to-b from-black/50 to-black/0"></div>
						<div
							class="absolute bottom-0 h-24 w-full bg-gradient-to-t from-black/30 to-black/0"
						></div>
					{/if}
					<div class="relative w-full self-end" style="opacity: {bigTitleOpacity}">
						{#if titleSelectOptions}
							<Popover.Root bind:open={titleSelectMobileOpen}>
								<Popover.Trigger
									class="hover:bg-a-accent/20 mx-2 flex items-center gap-3 rounded-lg border border-slate-100/20  bg-slate-50/5 p-2 px-4 font-medium text-slate-500/70 transition-all"
								>
									<div
										class="w-full px-0 text-left text-2xl font-semibold tracking-wide text-white"
										style="text-shadow: 1px 1px 0 rgba(0,0,0,0.8)"
									>
										{titleSelectOptions?.find(({value}) => value === titleSelectValue)?.label || ''}
									</div>
									<ChevronDown class="h-8 w-8 px-0 text-white hover:bg-transparent"></ChevronDown>
								</Popover.Trigger>
								<Popover.Content class="p-0" align="start">
									<div
										class="max-h-120 flex w-full flex-col gap-0.5 overflow-auto !rounded-lg px-1 py-1 text-slate-600"
									>
										{#each titleSelectOptions as { value, label }}
											<button
												on:click={() => { titleSelectOpen = false;titleSelectValue = value;}}
												class="flex w-full items-center justify-start rounded-lg bg-white px-3 py-2.5 !outline-none transition-all {value === titleSelectValue? 'bg-slate-300/50' : 'bg-white hover:bg-slate-100'}"
											>
												{label}
											</button>
										{/each}
									</div>
								</Popover.Content>
							</Popover.Root>
						{:else}
							<div
								class="w-full px-6 pb-4 text-left text-3xl font-semibold tracking-wide text-white"
								style="text-shadow: 1px 1px 0 rgba(0,0,0,0.8)"
							>
								{bigTitle}
							</div>
						{/if}
					</div>
				</div>
			{/if}
			<div class="container">
				{#if bigTitle && !photo}
					<div class="mb-6 hidden pt-10 text-3xl font-semibold lg:block">
						{#if titleSelectOptions}
							<Popover.Root bind:open={titleSelectOpen}>
								<Popover.Trigger
									class=" flex items-center gap-3 rounded-lg border border-slate-600/10 bg-slate-400/10  p-2 px-4 font-medium text-slate-700 transition-all hover:bg-slate-400/20"
								>
									<div
										class="w-full px-0 text-left text-2xl font-semibold tracking-wide text-slate-700"
									>
										{titleSelectOptions?.find(({value}) => value === titleSelectValue)?.label || ''}
									</div>
									<ChevronDown class="h-8 w-8 px-0 text-slate-500/70 hover:bg-transparent"
									></ChevronDown>
								</Popover.Trigger>
								<Popover.Content class="rounded-lg p-0" align="start">
									<div
										class="max-h-120 flex w-full flex-col gap-0.5 overflow-auto !rounded-lg px-1 py-1 text-slate-600"
									>
										{#each titleSelectOptions as { value, label }}
											<button
												on:click={() => { titleSelectOpen = false;titleSelectValue = value;}}
												class="flex w-full items-center justify-start rounded-lg bg-white px-3 py-2.5 !outline-none transition-all {value === titleSelectValue? 'bg-slate-300/50' : 'bg-white hover:bg-slate-100'}"
											>
												{label}
											</button>
										{/each}
									</div>
								</Popover.Content>
							</Popover.Root>
						{:else}
							{title}
						{/if}
					</div>
				{:else}
					<div class="hidden h-32 w-full lg:block"></div>
				{/if}
				<!-- the content -->
				<div class="contentSlot">
					<slot />
				</div>
			</div>
		</div>
	</div>
</div>

<style>
.topControls {
	padding-top: calc(env(safe-area-inset-top) * 1.2);
	padding-bottom: calc(env(safe-area-inset-top) * 0.5);
}
.contentSlot {
	padding-bottom: calc(env(safe-area-inset-top) * 2);
	padding-top: 0;
}
.bigTitle {
	padding-top: 3.5rem;
}
</style>
