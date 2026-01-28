<script lang="ts">
	import { tw } from 'src/lib/tw'

	let className = ''
	export { className as class }
	export let percent = 0
	export let progressBaseClass = 'bg-gray'
	export let progressClass = ''
	export let label = ''
</script>

<div class={tw(`w-40 ${className}`)}>
	<div class={tw(`progressShell h-2.5 w-full rounded-full bg-slate-700/70 ${progressBaseClass}`)}>
		<div
			class={tw(
				`progress bg-brightgreen-800 h-full rounded-full transition-all duration-200 ${progressClass}`,
			)}
			style={`width: ${Math.min(100, percent)}%`}
		/>
	</div>

	{#if label}
		<div class="label mt-1 text-left text-xs font-semibold text-slate-800">
			{label}
		</div>
	{/if}
</div>
