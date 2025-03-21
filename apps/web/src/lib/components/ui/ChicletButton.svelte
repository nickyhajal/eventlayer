<script>
	import Button from './button/button.svelte'

	let className = ''
	export { className as class }
</script>

<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3 bg-white {className}" on:click>
	<slot />
</Button>
