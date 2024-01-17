<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

const me = getMeContext()
</script>

<Screen title="Save Our Sites">
	<div class="container mx-auto md:max-w-7xl">
		{#if $me && false}
			<div>You're Logged In</div>
		{:else}
			<enhanced:img
				src="../../../static/banner.jpg"
				alt="An alt text"
				class="mx-auto my-10 w-full md:w-8/12"
			/>
			<div class="rounded-t-xl bg-slate-200 p-3 text-center font-medium">
				<div class="text-lg">Friday, February 2, 2024</div>
				<div>8AM-5PM</div>
			</div>
			<div class="mb-2 rounded-b-xl bg-slate-100 p-8 text-center font-medium">
				<div>
					<div class="mb-1 px-4 text-lg leading-tight">
						The University of Arizona Student Union Grand Ballroom
					</div>
					1303 E. University Blvd, Tucson, AZ 85719
				</div>
			</div>
			<div class="mt-8 border-t border-slate-100 pt-8">
				<div class="text-base font-extrabold uppercase text-slate-500">Next Up</div>
				<div class="mt-1 text-xl font-bold text-slate-700">Kick-off Get Together</div>
			</div>
		{/if}
	</div>
</Screen>
