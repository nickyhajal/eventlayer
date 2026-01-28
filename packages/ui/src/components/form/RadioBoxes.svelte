<script lang="ts">
	import Icon from '../Icon.svelte'
	import Button from './Button.svelte'

	export let value = []
	export let options = []
	export let multi = false

	function toggle(val) {
		if (multi && value.includes(val)) {
			value = value.filter((v) => v !== val)
		} else {
			value = multi ? [...value, val] : val
		}
		value = value
		options = options
	}
	function selected(val) {
		return value && multi ? value.includes(val) : value === val
	}
</script>

<div
	class="flex flex-col gap-4 md:grid"
	style={`grid-template-${options.length > 3 ? 'columns' : 'rows'}: 1fr 1fr;`}
>
	{#each options as { label, value: val }}
		<button
			on:click={() => toggle(val)}
			class={`hover:border-brightgreen-800 flex flex-none items-center rounded-xl border-2 border-slate-600 bg-slate-500 p-4 text-left text-sm font-semibold transition duration-200 hover:border-opacity-20 ${
				selected(val)
					? 'border-brightgreen-800 border-opacity-30 !bg-emerald-50 text-slate-900'
					: 'text-slate-900'
			} ${options.length === 3 ? '' : ''}`}
		>
			<div
				class:rounded-full={!multi}
				class:rounded={multi}
				class:bg-brightgreen-800={selected(val) && multi}
				class:bg-white={!selected(val) || !multi}
				class={`${
					selected(val)
						? multi
							? 'border-brightgreen-800'
							: 'border-brightgreen-800'
						: 'border-gray-200'
				} mr-4 flex h-6 w-6 flex-none items-center justify-center border  transition duration-200`}
			>
				{#if multi}
					<Icon icon="check" />
				{:else}
					<div
						class:bg-green={selected(val)}
						class:bg-white={!selected}
						class="h-3 w-3 rounded-full"
					/>
				{/if}
			</div>
			{label}</button
		>
	{/each}
</div>
