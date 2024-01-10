<script lang="ts">
	import Animate from '$src/components/Animate.svelte'
	import HeroIcon from '$src/components/HeroIcon.svelte'
	import Loading from '$src/components/Loading.svelte'
	import { tw } from 'src/lib/tw'
	import { SvelteComponent } from 'svelte'
	import { fade } from 'svelte/transition'
	let className = 'purple'
	export { className as class }
	export let type: 'submit' | 'reset' | 'button' | undefined | null = 'submit'
	export let to: string | false = false
	export let shake = false
	export let loading = false
	export let prio = 'primary'
	export let style = 'primary'
	export let elmStyle = ''
	export let contentClass = ''
	export let iconClass = ''
	export let iconPosition = 'right'
	export let disabled = false
	export let icon: SvelteComponent | undefined

	let focused = false
	const styles: { [key: string]: string } = {
		none: '',
		white: 'bg-white text-gray-800 hover:bg-gray-500',
		primary: 'bg-emerald-500 text-white hover:bg-brightgreen-800',
	}
</script>

<svelte:element
	this={to ? 'a' : 'button'}
	href={to ? to : undefined}
	class:shake
	on:click
	class:cursor-not-allowed={disabled}
	class:opacity-60={disabled}
	class={tw(
		`relative flex h-[3.2rem] w-full items-center overflow-hidden rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${prio} style-${style} ${
			styles[style]
		} ${className} ${!icon ? 'py-0' : ''}`,
	)}
	{type}
	{disabled}
	style={elmStyle}
>
	{#if loading}
		<div
			transition:fade|local={{ duration: 120 }}
			class="absolute bottom-0 left-0 right-0 top-0 m-auto flex h-full items-center justify-center"
		>
			<Loading class="h-8 w-8" />
		</div>
	{/if}
	<div
		class={`flex h-full grow items-center transition-all ${loading ? 'opacity-0' : 'opacity-100'}`}
	>
		{#if icon && iconPosition === 'left'}
			<div class="bg-emerald-600">
				<HeroIcon src={icon} class={tw(`h-6 ${iconClass}`)} theme="solid" />
			</div>
		{/if}
		<div class={`flex-grow text-center ${icon ? 'p-4 px-10' : ''} ${contentClass}`}>
			<slot />
		</div>
		{#if icon && iconPosition === 'right'}
			<div
				class="flex h-full w-16 items-center justify-center border-l border-emerald-600/30 bg-gradient-to-r from-emerald-600/30 to-emerald-600/20"
			>
				<HeroIcon src={icon} class={tw(`h-6 ${iconClass}`)} theme="solid" />
			</div>
		{/if}
	</div>
</svelte:element>

<style lang="postcss">
	button,
	a {
		&.shake {
			animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
			transform: translate3d(0, 0, 0);
			backface-visibility: hidden;
			perspective: 1000px;
		}
		&.style-red {
			background: #ffeff2;
			color: #ff5858;
			&:hover {
			}
		}
		&.style-blue {
			&:hover {
			}
		}
		&.style-gray {
			&:hover {
			}
		}
		&.style-emerald-500 {
			&:hover {
			}
		}
		&.style-disabled {
			pointer-events: none;
			cursor: default;
		}
		&.low {
			padding: 1rem 0;
			&:hover {
			}
		}
		@keyframes shake {
			10%,
			90% {
				transform: translate3d(-1px, 0, 0);
			}

			20%,
			80% {
				transform: translate3d(2px, 0, 0);
			}

			30%,
			50%,
			70% {
				transform: translate3d(-4px, 0, 0);
			}

			40%,
			60% {
				transform: translate3d(4px, 0, 0);
			}
		}
	}
</style>
