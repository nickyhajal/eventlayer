<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

import { getMediaUrl, shuffle } from '@matterloop/util'

export let data
$: sponsors = shuffle(data.sponsors)
const me = getMeContext()
</script>

<Screen title="Sponsors" bigTitle="Sponsors">
	<div class="container mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-2 grid grid-cols-1 gap-4 py-2">
			{#each sponsors as sponsor}
				{@const {id, title, url, photo, description} =sponsor}
				<a href={url} class="relative z-0 flex flex-col rounded-2xl bg-white p-1">
					<div
						class="mb-2 h-48 w-full rounded-lg border border-slate-100 bg-slate-50/80 bg-cover bg-center"
						style="background-image: url({getMediaUrl(photo)})"
					></div>
					<div class="px-2 pb-2">
						<div class="mb-0.5 truncate text-lg font-semibold">{title}</div>
						<div class="line-clamp-2 pr-2 text-base text-slate-600">{description}</div>
					</div>
					<div
						class="mt-2 flex h-12 w-full items-center justify-around border-t border-slate-100 font-semibold text-slate-600"
					>
						<a
							href="/sponsors/{id}"
							class="flex h-full w-1/2 items-center justify-center border-r border-slate-100 text-center"
							>Learn More</a
						>
						<a
							href={url}
							target="_blank"
							class="flex h-full w-1/2 items-center justify-center text-center">Book Session</a
						>
					</div>
				</a>
			{/each}
		</div>
	</div>
</Screen>
