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
		`shell flex items-center justify-between gap-1 ${className} rounded-xl border-2 border-slate-600 p-[0.15rem]`,
	)}
>
	{#each options as o}
		<button
			class={`
        multibutton mt-0 flex-1 cursor-pointer rounded-[0.5rem]  pb-2 pt-2.5 text-base font-semibold transition-all duration-200
        ${
					o.value === value
						? 'border-brightgreen-700 border-2 border-opacity-40 bg-emerald-100 bg-opacity-50 text-black text-opacity-60 hover:bg-opacity-80'
						: 'border-2 border-white bg-white  text-black text-opacity-60 hover:bg-slate-500'
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
