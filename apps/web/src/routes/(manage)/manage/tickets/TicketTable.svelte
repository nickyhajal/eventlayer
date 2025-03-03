<script lang="ts">
	import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'

	import type { User } from '@matterloop/db'
	// import { rankItem } from '@tanstack/match-sorter-utils';
	import { capitalize, dayjs, getMediaUrl, startCase } from '@matterloop/util'

	export let rows: User[]
	export let table
	export let setCurrentPage
	export let setGlobalFilter

	const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
		if (value.length) {
			const colVal = row.getValue(columnId)
			// if (value.length === 0) return true
			return colVal.includes(value)
		}
	}
	const onRowClick = (row: Row<Event>) => {
		// goto(`/manage/people/${row.original.id}`)
	}

	const columns: ColumnDef<User>[] = [
		{
			accessorKey: 'photo',
			header: 'Photo',
			// cell: (info) => startCase(info.getValue()),
			accessorFn: (row) => `userAvatar:${JSON.stringify(row.user)}`,
			// filterFn: globalFilterFn,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => startCase(info.getValue()),
			filterFn: globalFilterFn,
		},
		{
			accessorKey: 'quantity',
			header: 'Quantity',
			cell: (info) => info.getValue(),
		},
		{
			accessorKey: 'purchaser',
			header: 'Purchaser',
			accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`,
		},
		{
			accessorKey: 'email',
			header: 'E-Mail Address',
			accessorFn: (row) => `${row.user.email}`,
		},
	]
</script>

<Table
	{columns}
	{rows}
	sorting={[{ id: 'purchaser', desc: false }]}
	pageSize={25}
	{globalFilterFn}
	bind:table
	bind:setCurrentPage
	bind:setGlobalFilter
	{onRowClick}
	emptyMsg="No tickets yet"
/>
