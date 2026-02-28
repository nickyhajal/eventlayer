<script lang="ts">
	export let src = ''
	export let base = ''
	let className = ''
	export { className as class }

	let error = false
	let tries = 0

	function handleError(e) {
		if (tries === 0) {
			if (src.includes('/dev')) src = src.replace('/dev', '')
			tries += 1
			return
		}
		error = true
	}
</script>

<img
	class={`h-full w-full ${className || ''}`}
	on:error={() => {}}
	on:click
	src={`${!error ? src : base}`}
	alt=""
/>
