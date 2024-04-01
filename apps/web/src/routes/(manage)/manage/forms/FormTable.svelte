<script lang="ts">
import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
import { type FilterFn } from '@tanstack/svelte-table'
import { goto } from '$app/navigation'
import Table from '$lib/components/ui/Table.svelte'

import type { Form } from '@matterloop/db'
// import { rankItem } from '@tanstack/match-sorter-utils';
import { capitalize, dayjs } from '@matterloop/util'

export let rows: Form[]

const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
	if (Array.isArray(value)) {
		if (value.length === 0) return true
		return value.includes(row.getValue(columnId))
	}
}
const onRowClick = (row: Row<Event>) => {
	goto(`/manage/forms/${row.original.id}`)
}

const columns: ColumnDef<Form>[] = [
	{
		accessorKey: 'type',
		header: 'Type',
		cell: (info) => capitalize(info.getValue()),
		filterFn: globalFilterFn,
	},
	{
		accessorKey: 'name',
		header: 'Name',

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

<Table
	columns={columns}
	rows={rows}
	globalFilterFn={globalFilterFn}
	onRowClick={onRowClick}
	emptyMsg="No forms yet"
/>
