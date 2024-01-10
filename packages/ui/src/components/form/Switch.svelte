<script lang="ts">
	import { tw } from '../../lib/tw'
	import { createEventDispatcher } from 'svelte'
	import { uuid } from '@matterloop/util'

	export let value = false
	export let label = ''
	export let labelClass = ''
	export let showLabels = false
	export let format = 'normal'
	const { v4 } = uuid
	export let name = v4()

	const dispatch = createEventDispatcher()

	let id = v4()
	const handleChange = (e) => {
		// dispatch('change', { e: { target: { value: e.target.checked } } })
		dispatch('change', { event: e })
		// value = e.target.value
	}
</script>

<label
	class={tw(
		`flex w-full items-center justify-between text-sm font-semibold text-slate-900/80 ${labelClass}`,
	)}
	on:mouseover
	on:mouseout
	on:focus
	on:blur
>
	<span>{label}</span>
	{#if format === 'normal'}
		<div class="switch relative grid h-10 w-28">
			<input type="checkbox" class="bg-emerald-500" bind:checked={value} />
			<div
				class="slider duration-400 bottom-0 left-0 right-0 top-0 grid h-10 cursor-pointer grid-cols-2 items-center rounded-full bg-gray-500 transition"
			>
				{#if showLabels}
					<div class="text-center text-sm text-white opacity-90">Off</div>
					<div class="text-center text-sm opacity-70">On</div>
				{/if}
				<span
					class="toggle absolute bottom-0 top-0 m-auto flex w-1/2 items-center justify-center rounded-full text-sm"
				>
					{#if showLabels}
						{value ? 'On' : 'Off'}
					{/if}
				</span>
			</div>
		</div>
	{:else if format === 'small'}
		<div class="switch relative grid h-5 w-10">
			<input type="checkbox" class="bg-emerald-500" bind:checked={value} on:change={handleChange} />
			<div
				class="slider duration-400 bottom-0 left-0 right-0 top-0 grid h-5 cursor-pointer grid-cols-2 items-center rounded-full bg-gray-500 transition"
			>
				<span
					class="toggle absolute bottom-0 left-0.5 top-0 m-auto flex h-4 w-4 items-center justify-center rounded-full text-sm"
				/>
			</div>
		</div>
	{/if}
</label>

<style lang="postcss">
	.switch input {
		opacity: 0;
		width: 0;
		margin-top: -24px;
		height: 0;
	}
	.slider {
		user-select: none;
	}
	.toggle {
		content: '';
		background-color: white;
		transition: 0.4s;
		box-shadow: 0px 1px 2px rgba(10, 20, 73, 0.08), 0px 2px 5px rgba(10, 20, 73, 0.1);
	}
	input:checked + .slider {
		@apply bg-emerald-500;
	}
	input:checked + .slider .toggle {
		transform: translateX(calc(100% + 4px));
	}
</style>
