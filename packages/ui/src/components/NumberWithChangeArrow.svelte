<script lang="ts">
	export let value
	$: isPositive = value > 0
	$: color = isPositive > 0 ? 'text-green' : 'text-red'
</script>

<div class={`flex items-center text-2xl ${color} w-20 justify-between`}>
	{#if value}
		<div class={`mask-to-right mx-4 ${isPositive ? '-rotate-45' : 'rotate-45'} justify-center`}>
			<!-- <HeroIcon src={ArrowNarrowRight} class="w-6 flex-none" /> -->
		</div>
		{value}
	{:else}
		<div class="ml-12 text-2xl text-slate-800">-</div>
	{/if}
</div>
