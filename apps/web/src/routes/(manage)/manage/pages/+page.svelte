<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import Plus from 'lucide-svelte/icons/plus'
	import { tick } from 'svelte'

	import type { Snapshot } from './$types'
	import AdminScreen from '../AdminScreen.svelte'
	import PageForm from './PageForm.svelte'
	import PageTable from './PageTable.svelte'

	export let data
	let table
	let setCurrentPage
	let setGlobalFilter

	type PageStats = {
		attendees: number
		checkinsCompleted: number
	}

	const emptyStats: PageStats = {
		attendees: 0,
		checkinsCompleted: 0,
	}

	let addOpen = false
	let loading = false
	$: stats = (data.stats ?? emptyStats) as PageStats
	$: attendees = stats.attendees
	$: checkinsCompleted = stats.checkinsCompleted
	$: attendeeCheckinPercent = attendees > 0 ? Math.round((checkinsCompleted / attendees) * 100) : 0
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
	<div class="flex items-center gap-5" slot="title">
		<div class="text-2xl font-semibold">Pages</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => (addOpen = true)}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Page</Button
		>
	</div>
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<div class="mb-3 text-sm font-medium text-gray-500">Attendees Checked In</div>
			<div class="text-4xl font-bold leading-none text-gray-900">{attendeeCheckinPercent}%</div>
			<div class="mt-2 text-sm text-gray-500">
				{checkinsCompleted.toLocaleString()}/{attendees.toLocaleString()}
			</div>
		</div>
	</div>
		<PageTable rows={data.pages} bind:table bind:setCurrentPage bind:setGlobalFilter />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<PageForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
