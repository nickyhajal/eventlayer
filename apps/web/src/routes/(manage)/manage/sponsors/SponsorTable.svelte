<script lang="ts">
import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
import { type FilterFn } from '@tanstack/svelte-table'
import { goto } from '$app/navigation'
import Table from '$lib/components/ui/Table.svelte'

import type { Sponsor } from '@matterloop/db'
// import { rankItem } from '@tanstack/match-sorter-utils';
import { capitalize, dayjs, startCase } from '@matterloop/util'

export let rows: Sponsor[]

const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
	if (Array.isArray(value)) {
		if (value.length === 0) return true
		return value.includes(row.getValue(columnId))
	}
}
const onRowClick = (row: Row<Event>) => {
	goto(`/manage/sponsors/${row.original.id}`)
}

const columns: ColumnDef<Sponsor>[] = [
	{
		accessorKey: 'type',
		header: 'Type',
		cell: (info) => startCase(info.getValue()),
		filterFn: globalFilterFn,
	},
	{
		accessorKey: 'title',
		header: 'Name',

		cell: (info) => (info.getValue() as number).toString(),
	},
	{
		accessorKey: 'ord',
		header: 'Order',

		cell: (info) => ((info.getValue() as number) || 0).toString(),
	},
]
</script>

<Table
	sorting={[{id: 'ord', desc: false}]}
	columns={columns}
	rows={rows}
	globalFilterFn={globalFilterFn}
	onRowClick={onRowClick}
	emptyMsg="No sponsors yet"
/>
