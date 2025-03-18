<script lang="ts">
	import { trpc } from '$lib/trpc/client'
	import Plus from 'lucide-svelte/icons/plus'
	import { dndzone } from 'svelte-dnd-action'
	import { flip } from 'svelte/animate'
	import { writable } from 'svelte/store'

	import type { Menu } from '@matterloop/db'

	import MenuRow from './MenuRow.svelte'

	export let items: Menu[] = []
	export let location: string
	export let eventId: string
	const menu = writable<Menu[]>(items || [])

	function removeElement(id: string) {
		$menu = $menu.filter((item) => item.id !== id)
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
		if (orderChanges.length && $menu.length > 0) {
			trpc().menu.order.mutate({
				location: location,
				eventId: eventId,
				changes: orderChanges,
			})
		}
	}

	async function addMenuItem() {
		const newMenuItem: Partial<Menu> = {
			location: location,
			eventId: eventId,
			label: 'New Menu Item',
			link: '/',
			icon: 'CircleChevronRight',
			ord: $menu.length,
			status: 'active',
		}

		try {
			const result = await trpc().menu.upsert.mutate(newMenuItem as any)
			if (result) {
				$menu = [...$menu, result]
			}
		} catch (error) {
			console.error('Failed to add menu item:', error)
		}
	}

	const flipDurationMs = 300
	function handleDndConsider(e: CustomEvent<{ items: Menu[] }>) {
		$menu = e.detail.items
	}
	function handleDndFinalize(e: CustomEvent<{ items: Menu[] }>) {
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
			<MenuRow {item} on:delete={(e) => removeElement(e.detail.id)} />
		</div>
	{/each}

	<div class="mt-2">
		<button
			on:click={addMenuItem}
			class="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
		>
			<Plus class="h-4 w-4" />
			<span>Add Menu Item</span>
		</button>
	</div>
</div>
