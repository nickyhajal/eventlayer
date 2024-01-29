<script lang="ts">
import ChevronRight from 'lucide-svelte/icons/chevron-right'

import type { User } from '@matterloop/db'
import { getMediaUrl } from '@matterloop/util'

import Button from './ui/button/button.svelte'

export let user: User
</script>

<div class="block h-fit w-full items-start justify-start rounded-lg border px-2 py-1.5 text-left">
	<Button
		variant="ghost"
		href="/speakers/{user.id}"
		class="flex h-fit w-full items-center justify-between gap-2 rounded-lg bg-slate-100 px-4 py-3 text-left hover:bg-slate-200"
	>
		<div class="flex items-center gap-2 whitespace-normal">
			{#if user.photo}
				<img src={getMediaUrl(user.photo)} class="h-10 w-10 rounded-full" alt="speaker photo" />
			{/if}
			<div>
				<div class="text-xl font-semibold">{user.firstName} {user.lastName}</div>
				<div class="line-clamp-1 text-slate-600">
					{#if user.company && user.title}
						{user.company} | {user.title}
					{:else if user.company}
						{user.company}
					{:else if user.title}
						{user.title}
					{/if}
				</div>
			</div>
		</div>
		<div>
			<ChevronRight class="h-6 w-6 text-slate-600" />
		</div></Button
	>
</div>
