<script lang="ts">
	export let label: string;
	export let value: number;
	export let unit: string;
	export let loading: boolean = false;
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<div class="flex-1">
			<h3 class="text-sm font-medium text-gray-500 mb-1">{label}</h3>
			{#if loading}
				<div class="w-12 h-8 bg-gray-200 animate-pulse rounded"></div>
			{:else}
				<div class="flex items-baseline">
					<p class="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
					<span class="ml-2 text-sm text-gray-500">{unit}</span>
				</div>
			{/if}
		</div>
	</div>
</div>