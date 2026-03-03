<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import ListOrdered from 'lucide-svelte/icons/list-ordered'
	import Plus from 'lucide-svelte/icons/plus'
	import { tick } from 'svelte'

	import type { Snapshot } from './$types'
	import AdminScreen from '../AdminScreen.svelte'
	import SponsorForm from './SponsorForm.svelte'
	import SponsorTable from './SponsorTable.svelte'

	export let data
	let table
	let setCurrentPage
	let setGlobalFilter

	let addOpen = false
	let loading = false
	export const snapshot: Snapshot = {
		capture: () => {
			const state = table ? $table.getState() : undefined
			return {
				query: state?.globalFilter ?? '',
				scrollY: window.scrollY,
				page: state?.pagination?.pageIndex ?? 0,
				pageSize: state?.pagination?.pageSize,
				sorting: state?.sorting ?? [],
			}
		},
		restore: async ({ scrollY, page, pageSize, query, sorting }) => {
			await tick()
			if (table) {
				if (Array.isArray(sorting)) {
					$table.setSorting(sorting)
				}
				if (typeof pageSize === 'number') {
					$table.setPageSize(pageSize)
				}
				if (typeof query === 'string' && typeof setGlobalFilter === 'function') {
					setGlobalFilter(query)
				}
				if (typeof page === 'number' && typeof setCurrentPage === 'function') {
					setCurrentPage(page)
				}
			}
			window.requestAnimationFrame(() => {
				window.scrollTo(0, typeof scrollY === 'number' ? scrollY : 0)
			})
		},
	}
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-3" slot="title">
		<div class="text-2xl font-semibold">Sponsors</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => (addOpen = true)}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Sponsor</Button
		>
		<Button href="/manage/sponsors/order" variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3">
			<ListOrdered class="mr-2 w-[1rem] text-slate-700" />
			Set Order</Button
		>
	</div>
		<SponsorTable rows={data.sponsors} bind:table bind:setCurrentPage bind:setGlobalFilter />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<SponsorForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
