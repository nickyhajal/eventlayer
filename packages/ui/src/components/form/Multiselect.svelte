<script>
	import { tw } from 'src/lib/tw'

	let className = ''
	export { className as class }
	export let options = []
	export let value = false
	export let icon = false

	function select(choice) {
		value = choice.value
	}
</script>

<div
	class={tw(
		`shell flex items-center gap-1 justify-between ${className} border-2 border-slate-600 rounded-xl p-[0.15rem]`
	)}
>
	{#each options as o}
		<button
			class={`
        multibutton rounded-[0.5rem] mt-0 flex-1 cursor-pointer  pt-2.5 pb-2 text-base font-semibold transition-all duration-200
        ${
					o.value === value
						? 'bg-emerald-100 bg-opacity-50 border-opacity-40 text-black text-opacity-60 border-2 border-brightgreen-700 hover:bg-opacity-80'
						: 'bg-white text-black text-opacity-60  hover:bg-slate-500 border-2 border-white'
				}
      `}
			on:click|stopPropagation|preventDefault={() => select(o)}
			class:selected={o.value === value}
		>
			{o.label}
		</button>
	{/each}
</div>

<style lang="postcss">
</style>
