<script>
	import { tw } from 'src/lib/tw'
import Check from 'lucide-svelte/icons/check'

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
		`shell flex flex-wrap items-start gap-1 ${className}  border-slate-600 rounded-xl p-[0.15rem]`
	)}
>
	{#each options as o}
		{@const isSelected = selected.includes(o.value)}
		<button
			class={`
        multibutton px-1.5 min-w-24 max-w-full justify-start test-left flex-none items-center flex border-b-2 gap-2 rounded-md mt-0 cursor-pointer  pt-1 border pb-1 text-[0.8rem] font-medium transition-all duration-200
        ${isSelected
						? 'bg-emerald-100 bg-opacity-50 border-opacity-40 text-black text-opacity-60  border-emerald-600/20 hover:bg-opacity-80'
						: 'bg-white text-black text-opacity-60  hover:bg-slate-100  border-slate-300/50'
				}
      `}
			on:click|stopPropagation|preventDefault={() => select(o)}
			class:selected={isSelected}
		>
		<div class="w-4.5 h-4.5 overflow-hidden flex flex-none items-center justify-start text-left border
			{maxSelected === 1 ? 'rounded-full' : 'rounded'}
			{isSelected
						? 'bg-emerald-500 border text-black text-opacity-60  border-emerald-500'
						: 'bg-white text-black text-opacity-60  hover:bg-slate-500 border-slate-400/50 '
				}">
				{#if isSelected}
					{#if maxSelected === 1}
					<div class="h-4 w-4 bg-transparent flex items-center justify-center" >
						<div class="h-3.5 w-3.5  rounded-full bg-white/90 flex items-center justify-center">
						<div class="h-1.5 w-1.5  rounded-full bg-emerald-500"/>
							</div>
						</div>
					{:else}
						<Check class="h-4 w-4 text-white" />
					{/if}
					{:else}
					<div class="h-4 w-4 bg-transparent" />
					{/if}
				</div>
			<div class="mt-[1px] font-normal text-slate-700 leading-snug  text-left">{o.label}</div>
		</button>
	{/each}
</div>

<style lang="postcss">
</style>
