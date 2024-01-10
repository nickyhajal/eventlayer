<script lang="ts">
import { page } from '$app/stores'
import { getMeContext } from '$lib/state/getContexts'

const me = getMeContext()
$: path = $page.url.pathname
$: simple = path.startsWith('/report/')
</script>

{#if simple}
	<div
		class="flex w-full items-center justify-center border-b-2 border-b-gray-300/40 bg-white py-2.5"
	>
		<div class="text-base font-semibold tracking-wide text-slate-500">Eventlayer</div>
	</div>
{:else}
	<div
		class="flex w-full items-center justify-between border-b-2 border-b-gray-300/40 bg-white px-6 py-3"
	>
		<div class="text-lg font-semibold text-slate-700">Eventlayer</div>
		<div class="flex gap-1 text-base font-medium text-slate-800">
			{#if $me}
				{#if $me.canCreateCompany}
					<a
						href="/manage"
						class="rounded-md bg-white px-3.5 py-1.5 transition-all hover:bg-slate-100">Manage</a
					>
				{/if}
				<a
					href="/logout"
					class="rounded-md bg-white px-3.5 py-1.5 transition-all hover:bg-slate-100">Logout</a
				>
			{:else}
				<a href="/login" class="rounded-md bg-white px-3.5 py-1.5 transition-all hover:bg-slate-100"
					>Login</a
				>
			{/if}
		</div>
	</div>
{/if}
