<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@steeze-ui/heroicons'
	import { createEventDispatcher, onMount, tick } from 'svelte'

	import HeroIcon from './HeroIcon.svelte'

	export let durationMs: number = 500 //	Transition duration (ms)
	export let timingFunction: string = 'ease-in-out' //	CSS animation timing function
	export let id = ''
	export const getCarouselEl = () => carouselEl

	let currentPageIndex = 0
	$: {
		dispatch('pageChange', currentPageIndex)
	}

	let carouselEl: HTMLDivElement
	let pageWindowElement: HTMLDivElement
	let particlesContainer: HTMLDivElement
	$: pagesCount = particlesContainer ? particlesContainer.children.length : 1
	$: pageWindowWidth = pageWindowElement?.clientWidth ?? 0
	$: offset = -pageWindowWidth * currentPageIndex

	const dispatch = createEventDispatcher()

	async function handlePageChange(pageIndex: number) {
		currentPageIndex = pageIndex
	}

	function applyParticleSizes({
		particlesContainerChildren,
		particleWidth,
	}: {
		particlesContainerChildren: HTMLCollection
		particleWidth: number
	}) {
		for (let idx = 0; idx < particlesContainerChildren.length; idx++) {
			particlesContainerChildren[idx].style.minWidth = `${particleWidth}px`
			particlesContainerChildren[idx].style.maxWidth = `${particleWidth}px`
		}
	}

	onMount(() => {
		;(async () => {
			await tick()
			if (particlesContainer && pageWindowElement) {
				applyParticleSizes({
					particlesContainerChildren: particlesContainer.children,
					particleWidth: particlesContainer.getBoundingClientRect().width,
				})
			}
		})()
	})

	function goToPrevPage() {
		currentPageIndex = (currentPageIndex - 1 + pagesCount) % pagesCount
	}
	function goToNextPage() {
		currentPageIndex = (currentPageIndex + 1) % pagesCount
	}
</script>

<div class="flex w-full flex-col items-center" {id} bind:this={carouselEl}>
	<div class="flex w-full overflow-hidden" bind:this={pageWindowElement}>
		<div
			class="flex w-full transition-transform"
			style="
        transform: translateX({offset}px);
        transition-duration: {durationMs}ms;
        transition-timing-function: {timingFunction};
      "
			bind:this={particlesContainer}
		>
			<!-- <slot {loaded} {currentPageIndex}></slot> -->
			<slot />
		</div>
	</div>
	{#if pagesCount > 1}
		<div class="mt-2 flex w-full items-center justify-between">
			<button on:click={goToPrevPage}>
				<HeroIcon src={ChevronLeft} class="h-4 w-4" />
			</button>
			<div class="flex items-center">
				{#each Array(pagesCount) as _, pageIndex (pageIndex)}
					<div class="flex h-3 w-3 items-center justify-center">
						<button
							class="h-1.5 w-1.5 cursor-pointer rounded-full bg-gray-700 opacity-50 transition-all duration-300"
							class:dot-active={pageIndex === currentPageIndex}
							on:click={() => handlePageChange(pageIndex)}
						/>
					</div>
				{/each}
			</div>
			<button on:click={goToNextPage}>
				<HeroIcon src={ChevronRight} class="h-4 w-4" />
			</button>
		</div>
	{/if}
</div>

<style lang="postcss">
	.dot-active {
		@apply h-2 w-2 opacity-100;
	}
</style>
