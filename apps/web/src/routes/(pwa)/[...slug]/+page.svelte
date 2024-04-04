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
	<div class="shell mx-auto pt-2">
		<Markdown data={page.body} />
	</div></Screen
>

<style lang="postcss">
.shell {
	@apply text-slate-600;

	:global(h1) {
		@apply mb-2 mt-7 text-3xl font-bold;
	}
	:global(h2) {
		@apply mb-2 mt-7 text-2xl font-bold;
	}
}
</style>
