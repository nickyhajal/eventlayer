<script lang="ts">
	import HeroIcon from './HeroIcon.svelte'
	import { EllipsisHorizontal } from '@steeze-ui/heroicons'

	export let icon = 'dots'
	export let options = []
	let open = false
</script>

{#if options?.length}
	<div class="relative mt-2">
		<button on:click={() => (open = !open)}
			><HeroIcon
				class="h-7 w-6 text-slate-400 text-opacity-60 transition-all duration-200 hover:text-opacity-100 md:w-7"
				src={EllipsisHorizontal}
			/></button
		>
		{#if open}
			<button
				aria-label="Close popup menu"
				on:click={() => (open = false)}
				class="fixed left-0 top-0 z-10 h-full w-full cursor-default bg-white/40 transition-all"
			/>
			<div
				class="open absolute right-0 z-20 w-64 overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-lg"
			>
				{#each options as { handleClick, label }}
					<button
						on:click={() => {
							open = false
							handleClick()
						}}
						class="font-body w-full bg-white px-4 py-2 text-sm font-semibold text-slate-400 transition-all duration-200 hover:bg-blue-100/40"
						>{label}</button
					>
				{/each}
			</div>
		{/if}
	</div>
{/if}
