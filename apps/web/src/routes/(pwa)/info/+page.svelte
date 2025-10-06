<script lang="ts">
	import Screen from '$lib/components/Screen.svelte'
	import { getMeContext } from '$lib/state/getContexts'

	const me = getMeContext()
</script>

<Screen title="Info">
	<div class="mx-auto max-w-7xl">
		<div class="pt-32">
			<div class="text-center text-4xl font-bold text-slate-800">Info</div>
		</div>
	</div>
</Screen>
