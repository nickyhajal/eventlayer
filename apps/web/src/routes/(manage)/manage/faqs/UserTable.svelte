<script lang="ts">
import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
import { type FilterFn } from '@tanstack/svelte-table'
import { goto } from '$app/navigation'
import Table from '$lib/components/ui/Table.svelte'

import type { User } from '@matterloop/db'
// import { rankItem } from '@tanstack/match-sorter-utils';
import { capitalize, dayjs } from '@matterloop/util'

export let rows: User[]

const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
	if (Array.isArray(value)) {
		if (value.length === 0) return true
		return value.includes(row.getValue(columnId))
	}
}
const onRowClick = (row: Row<Event>) => {
	goto(`/manage/people/${row.original.id}`)
}

const columns: ColumnDef<User>[] = [
	{
		accessorKey: 'type',
		header: 'Type',
		cell: (info) => capitalize(info.getValue()),
		filterFn: globalFilterFn,
	},
	{
		accessorKey: 'firstName',
		header: 'First Name',

		cell: (info) => info.getValue().toString(),
	},
	{
		accessorKey: 'lastName',
		header: 'Last Name',

		cell: (info) => info.getValue().toString(),
	},
]
</script>

<Table
	columns={columns}
	rows={rows}
	globalFilterFn={globalFilterFn}
	onRowClick={onRowClick}
	emptyMsg="No people yet"
/>
