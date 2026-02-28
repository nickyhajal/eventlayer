<script lang="ts">
	import { goto } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import { trpc } from '$lib/trpc/client.js'
	import Plus from 'lucide-svelte/icons/plus'

	import type { Snapshot } from '../$types'
	import AdminScreen from '../AdminScreen.svelte'
	import EventForm from './[eventId]/EventForm.svelte'
	import EventTable from './EventTable.svelte'

	export let data
	let table
	let setCurrentPage
	let setGlobalFilter

	let addOpen = false
	let loading = false
	export const snapshot: Snapshot = {
		capture: () => {
			return {
				query: $table.getState().globalFilter,
				scrollY: window.scrollY,
				page: $table.getState().pagination.pageIndex,
				pageSize: $table.getState().pagination.pageSize,
				sorting: $table.getState().sorting,
			}
		},
		restore: ({ scrollY, page, pageSize, query, sorting }) => {
			if (Array.isArray(sorting)) {
				$table.setSorting(sorting)
			}
			if (typeof pageSize === 'number') {
				$table.setPageSize(pageSize)
			}
			if (typeof page === 'number') {
				setCurrentPage(page)
			}
			if (typeof query === 'string') {
				setGlobalFilter(query)
			}
			window.requestAnimationFrame(() => {
				window.scrollTo(0, scrollY || 0)
			})
		},
	}

	let event = {
		name: '',
		type: 'program',
		startsAt: '2024-01-14 09:00',
	}
	let type = { value: 'program', label: 'Program' }
	let eventTypes = [
		{ value: 'program', label: 'Program Event' },
		{ value: 'panel', label: 'Panel' },
		{ value: 'meetup', label: 'Meetup' },
		{ value: 'meal', label: 'Group Meal' },
		{ value: 'excursion', label: 'Excursion' },
	]
	$: event.type = type.value
	async function createEvent() {
		const res = await trpc().event.upsert.mutate(event)
		goto(`/manage/events/${res.id}`)
	}
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-5" slot="title">
		<div class="text-2xl font-semibold">Events</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => (addOpen = true)}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Event</Button
		>
	</div>
	<EventTable events={data.events} bind:table bind:setCurrentPage bind:setGlobalFilter />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<EventForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
