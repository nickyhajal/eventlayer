<script lang="ts">
	import type { ColumnDef, Row } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'

	import { capitalize, dayjs } from '@matterloop/util'

	export let events: Event[]
	export let table
	export let setCurrentPage
	export let setGlobalFilter

	const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
		if (Array.isArray(value)) {
			if (value.length === 0) return true
			return value.includes(row.getValue(columnId))
		}
	}

	const onRowClick = (row: Row<Event>) => {
		goto(`/manage/events/${row.original.id}`)
	}

	const columns: ColumnDef<Event>[] = [
		{
			accessorKey: 'type',
			header: 'Type',
			cell: (info) => capitalize(info.getValue()),
			filterFn: globalFilterFn,
		},
		{
			accessorKey: 'name',
			header: 'Event',

			cell: (info) => (info.getValue() as number).toString(),
		},
		// {
		// 	accessorKey: 'user',
		// 	header: 'Host',
		// 	cell: (info) => info.getValue() || '-',
		// },
		{
			accessorKey: 'numAttendees',
			header: '# Attending',
			cell: (info) => info.getValue() || '-',
		},
		{
			accessorKey: 'startsAt',
			id: 'Starts At',
			cell: (info) => dayjs(info.getValue()).format('MMM. Do [at] h:mma'),
			header: () => 'Starts',
		},
	]
</script>

<Table
	{columns}
	rows={events}
	{globalFilterFn}
	bind:table
	bind:setCurrentPage
	bind:setGlobalFilter
	{onRowClick}
/>
