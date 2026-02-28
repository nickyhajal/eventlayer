<script lang="ts">
	import Button from './Button.svelte'

	export let value
	export let columns
	export let empty
	export let displayer
</script>

<div class="shell">
	{#if !value || !value.length}
		<div class="empty">
			<h4>{empty.message}</h4>
			{#if empty.handleClick && empty.cta}
				<button class="text-xsm mt-4" on:click|stopPropagation={(e) => empty.handleClick(e)}>
					{empty.cta}
				</button>
			{/if}
		</div>
	{:else}
		<table>
			{#each value as val}
				<tr>
					{#each columns as col}
						<td>
							<h6>{col.title}</h6>
							{#if col.type === 'button'}
								<Button
									on:click={val[col.key].handler}
									class="text-gray float-right w-32 border border-gray-100 bg-white py-2 text-sm"
								>
									{val[col.key].label}
								</Button>
							{:else}
								<div>{(val && val[col.key]) || ''}</div>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</table>
	{/if}
</div>

<style lang="postcss">
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		@apply bg-gray-200;
		padding: 3rem;
		h4 {
			margin-top: 0;
			margin-bottom: 0;
			@apply text-gray-800;
		}
		button {
			width: 16rem;
			font-size: 0.8rem;
			padding: 0.75rem 0 0.65rem;
		}
	}
	table {
		width: 100%;
		border-collapse: 0;
		border-spacing: 0;
		td {
			text-align: left;
			padding: 0.5rem 1rem;
			h6 {
				text-transform: uppercase;
				font-size: 0.86rem;
				opacity: 0.5;
				font-weight: 800;
				margin-bottom: 0;
			}
			div {
				font-size: 0.95rem;
				font-weight: 600;
				@apply text-black;
			}
		}
		tr {
			@apply bg-gray-400;
			td {
				@apply border border-b-gray-600;
			}
			&:nth-of-type(2n) {
				@apply bg-gray-600;
			}
		}
	}
</style>
