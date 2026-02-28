<script lang="ts">
	import { tw } from '$src/lib/tw'

	import Avatar from './Avatar.svelte'

	let className = ''

	export { className as class }
	export let style
	export let users = []
	export let number = 4
	export let direction = 'ltr'
	export let size = 2
	export let overlap = 8
	export let avatarClass = false
	export let moreTextClass = 'text-sm w-fit p-3 text-black'

	let usersPrioritized = []
	// let moreTextClass = 'text-sm w-fit p-1 text-black'
	$: ltr = direction === 'ltr'
	$: usersPrioritized = [
		...users.filter(({ photo }) => photo),
		...users.filter(({ photo }) => !photo),
	]
	$: overlapMargin = `-${ltr ? 'ml' : 'mr'}-${overlap / 4}`
	$: moreNum = users.length - number
	$: moreText = moreNum > 0 ? `+${moreNum}` : false
</script>

<div
	{style}
	class={`flex ${className} justify-content: w-fit items-center ${ltr ? 'flex-start' : 'flex-end'}`}
>
	{#if !ltr && moreText}
		<div class={moreTextClass}>{moreText}</div>
	{/if}
	{#each usersPrioritized.slice(0, number) as { photo }, i}
		<div class={`${overlapMargin}`} style={`z-index: ${ltr ? number - i : i};`}>
			<Avatar {size} showFire={false} {photo} class={tw(`border-2 border-white ${avatarClass}`)} />
		</div>
	{/each}
	{#if ltr && moreText}
		<div class={`${moreTextClass} ${overlapMargin}`}>{moreText}</div>
	{/if}
</div>
