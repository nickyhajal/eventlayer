<script lang="ts">
	import HeroIcon from './HeroIcon.svelte'
	import { getMediaUrl } from '@matterloop/util'
	import { createEventDispatcher, onMount } from 'svelte'
	import { XMark } from '@steeze-ui/heroicons'
	import Portal from 'svelte-portal'

	let className = ''

	const dispatch = createEventDispatcher()

	export let images = []
	export let locked = false
	export let loading = 'eager'
	export let env = null
	export { className as class }
	export let imgClasses = 'max-w-full h-full  object-contain'
	export let on = 0
	export let lightbox = false
	let open = false

	onMount(() => setTimeout(loadNext, 100))

	$: on, loadNext()

	function src(img) {
		return `${getMediaUrl(img, env)}?v${img.version}&${locked ? 'w=320&blur=100' : 'w=1024'}`
	}
	function loadNext() {
		if (images && on + 1 < images.length) {
			const img = images[on + 1]
			const elm = new Image()
			elm.src = src(img)
			elm.onload = () => console.log('loaded')
		}
	}
	function handleKeydown(e) {
		if (e.keyCode === 27) {
			open = false
		}
		if (lightbox) {
			if (e.keyCode === 39) {
				goTo(1)
			}
			if (e.keyCode === 37) {
				goTo(-1)
			}
		}
	}
	function goTo(dir) {
		const tmp = on + dir
		if (tmp > 0 && tmp < images.length) {
			on = tmp
			dispatch('change', { index: on })
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />
{#if images}
	{#if open}
		<Portal target=".portals">
			<div
				class="fixed top-0 left-0 h-screen w-screen bg-black bg-opacity-90 z-50"
				on:click={() => (open = false)}
				on:keypress={() => (open = false)}
			>
				<button
					class="curser-pointer absolute right-6 top-6 z-30 rounded-full bg-transparent bg-opacity-0 p-2 transition-all duration-200 hover:bg-white hover:bg-opacity-10"
					><HeroIcon src={XMark} class="h-7 w-7 fill-current text-white" /></button
				>
				<svelte:self {images} {locked} {loading} {env} {on} lightbox={true} />
			</div>
		</Portal>
	{/if}
	<div
		class={`relative flex justify-center h-full  shell ${className} bg-transparent`}
		class:start={on === 0}
		class:end={on === images.length - 1}
	>
		<slot name="head" />
		<div
			class={`image-outer-wrap flex h-full ${
				lightbox ? '' : 'max-h-230 bg-white'
			} w-full overflow-hidden`}
		>
			<div
				on:keypress
				on:click
				class="image-inner-wrap relative flex w-full flex-nowrap transition duration-200"
				style={`transform: translateX(-${on * 100}%)`}
			>
				{#each images as img}
					<div
						class={`image flex w-wit flex-none justify-center ${
							lightbox ? 'max-w-7xl mx-auto bg-white' : 'cursor-pointer'
						}`}
						on:keypress={() => (open = lightbox ? false : true)}
						on:click={() => (open = lightbox ? false : true)}
					>
						<img {loading} class={`${imgClasses} max-w`} src={src(img)} alt="" />
					</div>
				{/each}
			</div>
		</div>
		<slot name="caption" />
		{#each [{ dir: 1, classes: `next mr-1.5 right-0 ${on === images.length - 1 ? 'opacity-0 pointer-events-none' : ''}`, path: 'M1 1L7 8L1 15' }, { dir: -1, classes: `prev left-0 ml-1.5 ${on === 0 ? 'opacity-0 pointer-events-none' : ''}`, path: 'M7 1L1 8L7 15' }] as row}
			<div
				class={`${row.classes} bg-opacity-80 shadow-md absolute bg-white w-8 h-8 top-0 bottom-0 m-auto flex justify-center rounded-full items-center cursor-pointer transition duration-200`}
				on:click={() => goTo(row.dir)}
				on:keypress={() => goTo(row.dir)}
			>
				<svg
					width="8"
					height="16"
					viewBox="0 0 8 16"
					class=" stroke-current text-emerald-600"
					style="width: 0.6rem"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d={row.path}
						stroke-width="2"
						stroke-miterlimit="10"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
		{/each}
	</div>
{/if}
