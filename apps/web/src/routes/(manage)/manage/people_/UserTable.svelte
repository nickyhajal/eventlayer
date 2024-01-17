<script lang="ts">
import type { ColumnDef, TableOptions } from '@tanstack/svelte-table'
import { type FilterFn } from '@tanstack/svelte-table'
import { goto } from '$app/navigation'
import Table from '$lib/components/ui/Table.svelte'

import type { Venue } from '@matterloop/db'
// import { rankItem } from '@tanstack/match-sorter-utils';
import { capitalize, dayjs } from '@matterloop/util'

export let rows: Venue[]

const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
	if (Array.isArray(value)) {
		if (value.length === 0) return true
		return value.includes(row.getValue(columnId))
	}
}

const columns: ColumnDef<Venue>[] = [
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

<Table columns={columns} rows={rows} globalFilterFn={globalFilterFn} />
