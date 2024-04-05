<script lang="ts">
import IconSelector from '$lib/components/IconSelector.svelte'
import { trpc } from '$lib/trpc/client'
import { trpcCaller } from '$lib/util/trpcCaller'
import GripVertical from 'lucide-svelte/icons/grip-vertical'
import { tick } from 'svelte'
import { toast } from 'svelte-sonner'
import { writable } from 'svelte/store'

import type { Menu } from '@matterloop/db'
import { debounce } from '@matterloop/util'

export let item: Menu
item.props = item.props
	? typeof item.props === 'object'
		? JSON.stringify(item.props)
		: item.props
	: ''
let menu = writable<Menu>(item)
let saving = false
let lastSavedMenu: string
let lastMenu = JSON.stringify($menu)
const { call, status, enhance } = trpcCaller(trpc().menu.upsert.mutate)

async function submitRaw() {
	if (lastSavedMenu !== JSON.stringify($menu)) {
		let shouldSubmit = false
		if (lastSavedMenu) shouldSubmit = true
		lastSavedMenu = JSON.stringify($menu)
		if (!shouldSubmit || saving) return
		saving = true
		const res = await call({
			...$menu,
		})
		toast.success('Menu Saved')
		if (res && res?.createdAt && !$menu.id) {
			menu.set({ ...$menu, id: res.id, createdAt: res.createdAt })
		}
		saving = false
	}
}
const save = debounce(submitRaw, 900)
$: if (lastMenu !== JSON.stringify($menu)) {
	lastMenu = JSON.stringify($menu)
}
$: save(), $menu
</script>

<div
	class="flex items-center rounded-lg border border-stone-200 bg-white px-1 py-1 text-sm font-medium text-stone-600"
>
	<button><GripVertical class="mr-2 h-5 w-5 text-stone-400/70" /></button>
	<div class="mr-2">
		<IconSelector bind:value={$menu.icon} />
	</div>
	<div>
		<input
			bind:value={$menu.label}
			class="mr-4 h-8 rounded-md bg-white px-2 font-medium text-stone-700 !outline-0 transition-all hover:bg-blue-50/70 focus:bg-blue-50/70"
		/>
	</div>
	<div>
		<input
			bind:value={$menu.link}
			class="mr-4 h-8 rounded-md bg-white px-2 font-medium text-stone-700 !outline-0 transition-all hover:bg-blue-50/70 focus:bg-blue-50/70"
		/>
	</div>
	<div>
		<input
			bind:value={$menu.props}
			placeholder="Additional Props"
			class="mr-4 h-8 rounded-md bg-white px-2 font-medium text-stone-700 !outline-0 transition-all hover:bg-blue-50/70 focus:bg-blue-50/70"
		/>
	</div>
</div>
