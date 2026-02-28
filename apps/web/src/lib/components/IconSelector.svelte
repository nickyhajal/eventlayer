<script lang="ts">
	import * as Popover from '$lib/components/ui/popover'
	import * as icons from 'lucide-static'

	const keys = Object.keys(icons)
	export let value = ''
	let iconsElm: HTMLDivElement
	let search = ''
	function handleOpenChange(open: boolean) {
		setTimeout(() => {
			if (value && open) {
				const elm = document.getElementById(`icon-${value}`)
				iconsElm.scrollTo({
					top: elm.offsetTop - 60,
				})
			}
		}, 0)
	}
	function iconList(str: string) {
		if (str) {
			return keys.filter((key) => key.toLowerCase().includes(str.toLowerCase()))
		}
		return keys
	}
</script>

<Popover.Root onOpenChange={handleOpenChange}>
	<Popover.Trigger
		class="flex items-center gap-3 rounded-lg border border-b-2 border-stone-200 border-b-stone-200/70 p-1.5 px-3 font-medium text-stone-500/70 transition-all hover:bg-stone-200/20"
	>
		<span>Menu Icon</span>
		{#if value}
			<div
				class="selected-icon flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-stone-100"
			>
				{@html icons[value]}
			</div>
		{:else}
			<div class="h-[1.7rem] w-[1.7rem] rounded-lg border border-stone-200 bg-stone-100"></div>
		{/if}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<input
			type="text"
			bind:value={search}
			class="w-full border-b border-stone-200 px-4 py-2 !outline-none"
			placeholder="Search Icons"
		/>
		<div
			class="grid max-h-64 w-full grid-flow-row-dense grid-cols-5 gap-0.5 overflow-auto px-4 py-1 text-stone-600"
			bind:this={iconsElm}
		>
			{#each iconList(search) as key}
				<button
					on:click={() => (value = key)}
					id="icon-{key}"
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-white transition-all {key ===
					value
						? 'bg-stone-300/50'
						: 'bg-white hover:bg-stone-100'}"
				>
					{#if icons[key]}
						{@html icons[key]}
					{/if}
				</button>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>

<style lang="postcss">
	.selected-icon :global(svg) {
		@apply h-[1.3rem] w-[1.3rem];
	}
</style>
