<script lang="ts">
	import { tw } from 'src/lib/tw'

	let className = ''
	export let percent = 0
	export let label = ''
	export let labelClass = ''
	export let labelTextSize = '[0.85rem]'
	export let progressClass = ''
	export let striped = false
	export { className as class }
	let progressWidth = 0
	let labelWidth = 0
	let s
	let labelClassBasedOnPosition = ''
	let labelX = 0
	$: {
		if (progressWidth - 10 > labelWidth) {
			labelX = progressWidth - labelWidth - 5
			labelClassBasedOnPosition = 'text-white text-shadow'
		} else {
			labelX = progressWidth + 6
			labelClassBasedOnPosition = 'text-slate-800'
		}
	}
</script>

<div class={tw(`relative h-4 overflow-hidden rounded-full`, className)}>
	<div
		class={tw(`relative h-full w-full rounded-full bg-gradient-to-r from-slate-600 to-slate-700 `)}
	>
		<div
			bind:clientWidth={progressWidth}
			class={tw(
				`to-brightgreen-700 absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 transition-all duration-200  ${progressClass}`,
			)}
			style={`width: ${Math.min(100, percent)}%`}
		/>
		<div
			bind:clientWidth={labelWidth}
			class={tw(
				`${labelClassBasedOnPosition} h-4.5 absolute bottom-0 top-0 my-auto whitespace-nowrap font-semibold italic ${labelClass} text-${labelTextSize}`,
			)}
			style={`left: ${labelX}px; transform: translateY(1px)`}
		>
			{label}
		</div>
		{#if striped}
			<div
				class={tw(
					`bg-striped absolute left-0 top-0 h-full rounded-full transition-all duration-200  ${progressClass}`,
				)}
				style={`width: ${percent}%`}
			/>
		{/if}
	</div>
</div>
