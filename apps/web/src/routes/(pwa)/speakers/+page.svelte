<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import { getMeContext } from '$lib/state/getContexts'

import { getMediaUrl } from '@matterloop/util'

export let data
$: users = data.users
const me = getMeContext()
$: console.log(users[0].mainEventUser)
</script>

<Screen title="Panelists & Moderators" bigTitle="Panelists & Moderators">
	<div class="container mx-auto -mt-2 max-w-7xl bg-slate-100">
		<div class="mt-2 grid grid-cols-2 gap-4 py-2">
			{#each users as user}
				{@const {user: {id, firstName, lastName}, media, mainEventUser} = user}
				<a
					href="/speakers/{mainEventUser.id}"
					class="relative z-0 flex flex-col rounded-2xl bg-white p-1"
				>
					<div
						class="mb-2 h-48 w-full rounded-lg bg-slate-100 bg-cover bg-center"
						style="background-image: url({getMediaUrl(media)})"
					></div>
					<div class="px-2 pb-2">
						<div class="mb-0.5 truncate text-sm font-semibold">{firstName} {lastName}</div>
						<div class="line-clamp-4 pr-4 text-sm text-stone-600">{mainEventUser?.proBio}</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</Screen>
