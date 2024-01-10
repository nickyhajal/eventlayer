<script lang="ts">
	type Link = { to: string; label: string }
	export let links: Link[] = []
	export let emptyMessage = 'Nothing here yet'
</script>

<div
	class="shadow-line flex flex-col divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200"
>
	{#each links as { to, label }}
		<a href={to} class="p-4 transition-all hover:bg-blue-50/60">{label}</a>
	{:else}
		<div class="bg-teal-50 rounded-lg p-4 text-center text-slate-400 font-medium">
			{emptyMessage}
		</div>
	{/each}
</div>
