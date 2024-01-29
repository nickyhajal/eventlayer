<script lang="ts">
import ChevronRight from 'lucide-svelte/icons/chevron-right'

import type { User } from '@matterloop/db'

import Button from './ui/button/button.svelte'

export let user: User
</script>

<div class="block h-fit w-full items-start justify-start rounded-lg border px-2 py-1.5 text-left">
	<Button
		variant="ghost"
		href="/users/{user.id}"
		class="flex h-fit w-full items-center justify-between gap-2 rounded-lg bg-slate-100 px-4 py-3 text-left hover:bg-slate-200"
	>
		<div class="whitespace-normal">
			<div class="text-xl font-semibold">{user.firstName} {user.lastName}</div>
			<div class="line-clamp-1 text-slate-600">{user.proBio}</div>
		</div>
		<div>
			<ChevronRight class="h-6 w-6 text-slate-600" />
		</div></Button
	>
</div>
