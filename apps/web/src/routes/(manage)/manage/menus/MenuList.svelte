<script lang="ts">
import { trpc } from '$lib/trpc/client'
import { dndzone } from 'svelte-dnd-action'
import { flip } from 'svelte/animate'
import { writable } from 'svelte/store'

import type { Menu } from '@matterloop/db'

import MenuRow from './MenuRow.svelte'

export let items: Menu[]
const menu = writable<Menu[]>(items)

function removeElement(index: number) {
	$menu.splice(index, 1)
	$menu = $menu
	handleChangedElements()
}
function handleChangedElements() {
	const orderChanges: { id: string; ord: number }[] = []
	$menu.map((elm, i) => {
		if (elm.ord !== i) {
			orderChanges.push({ id: elm.id, ord: i })
			$menu[i].ord = i
		}
	})
	if (orderChanges.length) {
		trpc().menu.order.mutate({
			location: $menu[0].location,
			eventId: $menu[0].eventId,
			changes: orderChanges,
		})
	}
}
const flipDurationMs = 300
function handleDndConsider(e) {
	$menu = e.detail.items
}
function handleDndFinalize(e) {
	$menu = e.detail.items
	handleChangedElements()
}
</script>

<div
	class="flex flex-col gap-1 px-2 pb-3"
	use:dndzone={{
	items: $menu,
	flipDurationMs,
	dropTargetStyle: {},
	dropTargetClasses: ['outline-blue-200', 'outline-dashed', 'outline-2'],
}}
	on:consider={handleDndConsider}
	on:finalize={handleDndFinalize}
>
	{#each $menu as item, i (item.id)}
		<div class="w-full" animate:flip={{ duration: flipDurationMs }}>
			<MenuRow item={item} />
		</div>
	{/each}
</div>
