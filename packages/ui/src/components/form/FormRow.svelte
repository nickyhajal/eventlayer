<script lang="ts">
	let className = ''
	export { className as class }
</script>

<div class={`shell formRow flex ${className}`}>
	<slot />
</div>

<style lang="postcss">
	.shell {
		&:empty {
			display: none;
		}
		margin-bottom: 1rem;
		width: 100%;
		gap: 0.6rem;
		&:last-of-type {
			margin-bottom: 0;
		}
	}
</style>
