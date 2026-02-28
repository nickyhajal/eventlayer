<script>
	import Check from 'lucide-svelte/icons/check'
	import { tw } from 'src/lib/tw'

	let className = ''
	export { className as class }
	export let options = []
	export let value = '[]'
	export let icon = false
	export let maxSelected = 2
	let selected = JSON.parse(value || '[]')

	function select(choice) {
		if (selected.includes(choice.value)) {
			selected = selected.filter((c) => c !== choice.value)
		} else {
			if (maxSelected === 1) {
				selected = [choice.value]
			} else if (selected.length < maxSelected) {
				selected.push(choice.value)
			}
		}
		value = JSON.stringify(selected)
		selected = selected
	}
</script>

<div
	class={tw(
		`shell flex flex-wrap items-start gap-1 ${className}  rounded-xl border-slate-600 p-[0.15rem]`,
	)}
>
	{#each options as o}
		{@const isSelected = selected.includes(o.value)}
		<button
			class={`
        multibutton test-left mt-0 flex min-w-24 max-w-full flex-none cursor-pointer items-center justify-start gap-2 rounded-md border border-b-2  px-1.5 pb-1 pt-1 text-[0.8rem] font-medium transition-all duration-200
        ${
					isSelected
						? 'border-emerald-600/20 border-opacity-40 bg-emerald-100 bg-opacity-50 text-black  text-opacity-60 hover:bg-opacity-80'
						: 'border-slate-300/50 bg-white text-black  text-opacity-60  hover:bg-slate-100'
				}
      `}
			on:click|stopPropagation|preventDefault={() => select(o)}
			class:selected={isSelected}
		>
			<div
				class="w-4.5 h-4.5 flex flex-none items-center justify-start overflow-hidden border text-left
			{maxSelected === 1 ? 'rounded-full' : 'rounded'}
			{isSelected
					? 'border border-emerald-500 bg-emerald-500 text-black  text-opacity-60'
					: 'border-slate-400/50 bg-white text-black  text-opacity-60 hover:bg-slate-500 '}"
			>
				{#if isSelected}
					{#if maxSelected === 1}
						<div class="flex h-4 w-4 items-center justify-center bg-transparent">
							<div class="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/90">
								<div class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
							</div>
						</div>
					{:else}
						<Check class="h-4 w-4 text-white" />
					{/if}
				{:else}
					<div class="h-4 w-4 bg-transparent" />
				{/if}
			</div>
			<div class="mt-[1px] text-left font-normal leading-snug text-slate-700">{o.label}</div>
		</button>
	{/each}
</div>

<style lang="postcss">
</style>
