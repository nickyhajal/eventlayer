<script lang="ts">
import { getMediaUrl } from '$lib/util/getMediaUrl'
import ChevronLeft from 'lucide-svelte/icons/chevron-left'
import { fade } from 'svelte/transition'

import type { Media } from '@matterloop/db'
import { tw } from '@matterloop/ui'

import Button from './ui/button/button.svelte'

export let title = ''
export let bigTitle = ''
export let back = ''
export let photo: Media
export let bodyClass = ''
let contentElm: HTMLDivElement
let bigTitleOpacity = 1
let mainTitleOpacity = bigTitle ? 0 : 1

function handleContentScroll(e) {
	const scrollY = e.currentTarget === contentElm ? contentElm.scrollTop : window.scrollY
	if (bigTitle) {
		if (scrollY > 0) {
			bigTitleOpacity = (100 - scrollY * 4) / 100
			mainTitleOpacity = (scrollY * 4) / 100
		} else {
			mainTitleOpacity = 0
			bigTitleOpacity = 1
		}
	}
}
</script>

<svelte:window on:scroll={handleContentScroll} />
<div
	class="relative mx-auto min-h-[40dvh] {bigTitle ? 'bg-white' : 'bg-white'} pt-16 lg:mt-4 lg:h-[80vh] lg:max-w-2xl lg:overflow-hidden lg:rounded-3xl lg:border lg:border-slate-100 lg:bg-white lg:pt-0 lg:shadow-lg"
>
	<div class="absolute top-0 z-10 h-64 w-full bg-slate-800"></div>
	<div
		class="topControls fixed top-0 z-50 flex h-12 w-full items-center justify-between bg-slate-800 py-2 lg:relative"
		style="--tw-bg-opacity: {photo ? mainTitleOpacity : 1}"
	>
		<div>
			{#if back}
				<div transition:fade>
					<Button variant="ghost" href={back} class="px-1 hover:bg-transparent">
						<ChevronLeft class="h-8 w-8 px-0 text-white hover:bg-transparent"></ChevronLeft>
					</Button>
				</div>
			{/if}
		</div>
		<div
			class="max-w-56 absolute left-0 right-0 mx-auto w-fit truncate text-center text-sm font-semibold text-white"
			style="opacity: {mainTitleOpacity}"
		>
			{title}
		</div>
		<div class=""></div>
	</div>
	<div
		class={tw(`relative z-20 -mt-0.5 bg-white pb-20 lg:h-[calc(100dvh-6.6rem)] lg:overflow-auto  ${photo ? '-mt-16' : ''} ${bodyClass}`)}
		bind:this={contentElm}
		on:scroll={handleContentScroll}
	>
		{#if bigTitle}
			<div
				class="bigTitle relative -top-0.5 flex w-full items-center justify-center bg-slate-800 bg-cover py-2 {photo ? 'h-64' : 'h-fit'}"
				style="background-image: url({getMediaUrl(photo)})"
			>
				{#if photo}
					<div class="absolute top-0 h-24 w-full bg-gradient-to-b from-black/50 to-black/0"></div>
					<div
						class="absolute bottom-0 h-24 w-full bg-gradient-to-t from-black/30 to-black/0"
					></div>
				{/if}
				<div class="relative w-full self-end" style="opacity: {bigTitleOpacity}">
					<div
						class="w-full px-6 pb-4 text-left text-3xl font-semibold tracking-wide text-white"
						style="text-shadow: 1px 1px 0 rgba(0,0,0,0.8)"
					>
						{bigTitle}
					</div>
				</div>
			</div>
		{/if}
		<slot />
	</div>
</div>

<style>
.topControls {
	padding-top: calc(env(safe-area-inset-top) + 1.5rem);
	padding-bottom: 1.5rem;
}
.bigTitle {
	padding-top: calc(env(safe-area-inset-top) + 1.5rem);
}
</style>
