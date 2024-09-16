<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getEventContext, getMeContext } from '$lib/state/getContexts'

import { Markdown } from '@matterloop/ui'
import { getMediaUrl } from '@matterloop/util'

export let data
const me = getMeContext()
const event = getEventContext()
const page = data.page
</script>

<Screen title={page.title} bigTitle={page.title}>
	<div class="shell pt-safe-offset-12 pb-safe-offset-24 mx-auto">
		<Markdown data={page.body} />
	</div></Screen
>

<style lang="postcss">
.shell {
	@apply text-slate-600;

	:global(h1) {
		@apply mb-6 mt-5 pr-2 text-3xl font-semibold text-slate-600/70;
	}
	:global(h2) {
		@apply mb-6 mt-7 text-2xl font-bold;
	}
	:global(h3) {
		@apply mb-6 mt-7 text-xl font-bold;
	}
	:global(ul) {
		@apply ml-4 pl-0.5;
	}
	:global(li) {
		@apply mb-1.5 list-disc;
	}
	:global(p) {
		@apply mb-6 text-base leading-relaxed;
	}
	:global(button) {
		@apply bg-a-accent text-white brightness-95;
	}
}
</style>
