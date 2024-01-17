<script lang="ts">
import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
import { type FilterFn } from '@tanstack/svelte-table'
import { goto } from '$app/navigation'
import Table from '$lib/components/ui/Table.svelte'
// import { rankItem } from '@tanstack/match-sorter-utils';
import { writable } from 'svelte/store'

import { capitalize, dayjs } from '@matterloop/util'

import type { PageData } from './$types'

export let events: Event[]

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
	{
		accessorKey: 'startsAt',
		id: 'Starts At',
		cell: (info) => dayjs(info.getValue()).format('MMM. Do [at] h:mma'),
		header: () => 'Starts',
	},
]
</script>

<Table columns={columns} rows={events} globalFilterFn={globalFilterFn} onRowClick={onRowClick} />
