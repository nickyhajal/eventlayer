<script>
	import Button from './button/button.svelte'

	let className = ''
	export { className as class }
</script>

<Button variant="outline" class="h-7 justify-center bg-white px-3 py-[0.3rem] text-center {className}" on:click>
	<slot />
</Button>
