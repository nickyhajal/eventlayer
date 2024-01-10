<script lang="ts">
import { Animate, Squircle } from '@matterloop/ui'
import type { IconSource } from '@steeze-ui/heroicons'
import { Icon } from '@steeze-ui/svelte-icon'
import { tw } from '$lib/tw'

let className = ''
export let squircleClass = ''
export let iconClass = ''
export { className as class }
export let icon: IconSource
export let href = ''

let tag = href ? 'a' : 'button'

let factor = 0.95
const props = { href }
</script>

<svelte:element
	this={tag}
	{...props}
	on:click
	on:mouseover
	on:mouseenter
	on:mouseleave
	class={`group items-center justify-center bg-transparent ${className}`}
>
	<slot />
	<Squircle
		class={tw(`h-12 w-12 fill-emerald-500 ${squircleClass} stroke-blue stroke-1`)}
		width={20}
		height={20}
		factor={factor}
	/>
	{#if icon}
		<Icon class={tw(`mx-auto h-8 w-8 text-gray-900 ${iconClass}`)} src={icon} theme="solid" />
	{/if}
</svelte:element>

<style lang="postcss">
button,
a {
	display: grid;
	> :global(*) {
		grid-area: 1 / 1 / 1 / 1;
	}
}
</style>
