<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Dialog from '$lib/components/ui/dialog'
import { trpc } from '$lib/trpc/client'
import Plus from 'lucide-svelte/icons/plus'
import { dndzone } from 'svelte-dnd-action'
import { flip } from 'svelte/animate'

import { orderBy, startCase } from '@matterloop/util'

import AdminScreen from '../../AdminScreen.svelte'

export let data
const vals = {
	sponsor: 0,
	'impact-partner': 1,
	'organizing-partner': 2,
}
let sponsors = data.sponsors.sort((a, b) => a.ord - b.ord || vals[a.type] - vals[b.type])

let addOpen = false
let loading = false
function handleChangedElements() {
	const orderChanges: { id: string; ord: number }[] = []
	sponsors.map((elm, i) => {
		if (elm.ord !== i) {
			orderChanges.push({ id: elm.id, ord: i })
			sponsors[i].ord = i
		}
	})
	if (orderChanges.length) {
		trpc().sponsor.order.mutate({ changes: orderChanges })
	}
}
const flipDurationMs = 300
function handleDndConsider(e) {
	sponsors = e.detail.items
}
function handleDndFinalize(e) {
	sponsors = e.detail.items
	handleChangedElements()
}
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-3" slot="title">
		<div class="text-2xl font-semibold">Order Sponsors</div>
	</div>
	<div
		class="flex h-full max-w-xl flex-col gap-1 bg-stone-50/80 px-2 pb-2 pt-2"
		use:dndzone={{
			items: sponsors,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: ['outline-blue-200', 'outline-dashed', 'outline-2'],
		}}
		on:consider={handleDndConsider}
		on:finalize={handleDndFinalize}
	>
		{#each sponsors || [] as element, i (element.id)}
			<div
				animate:flip={{ duration: flipDurationMs}}
				class="flex w-full justify-between rounded-xl border border-stone-100 bg-white p-3 text-sm font-medium text-stone-700/80"
			>
				<div class="text-stone-800/80">{element.title}</div>
				<div class="text-xs text-stone-800/50">{startCase(element.type)}</div>
			</div>
		{/each}
	</div>
</AdminScreen>
