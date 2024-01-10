<script lang="ts">
import { getMeContext } from '$lib/state/getContexts'

const me = getMeContext()
</script>

<div class="container mx-auto max-w-7xl">
	{#if $me && false}
		<div>You're Logged In</div>
	{:else}
		<div class="pt-32">
			<div class="text-center text-4xl font-bold text-slate-800">Welcome to Eventlayer</div>
			<div class="mx-auto w-6/12 pt-4 text-center text-2xl font-semibold text-slate-700">
				Powerful software for your events.
			</div>
		</div>
	{/if}
</div>
