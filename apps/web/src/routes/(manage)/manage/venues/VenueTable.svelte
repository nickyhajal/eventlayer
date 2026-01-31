<script lang="ts">
	import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'

	import type { Venue } from '@matterloop/db'
	import { capitalize, dayjs } from '@matterloop/util'

	export let rows: Venue[]

	let filterType = ''
	let filterVisible = ''

	$: types = [...new Set(rows.map((r) => r.type).filter(Boolean))].sort()

	$: filteredRows = rows.filter((r) => {
		if (filterType && r.type !== filterType) return false
		if (filterVisible === 'yes' && !r.visibleOnMainList) return false
		if (filterVisible === 'no' && r.visibleOnMainList) return false
		return true
	})

	const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
		if (!value || value.length === 0) return true
		const colVal = row.getValue(columnId)
		if (!colVal) return false
		return colVal.toString().toLowerCase().includes(value.toLowerCase())
	}
	const onRowClick = (row: Row<Event>) => {
		goto(`/manage/venues/${row.original.id}`)
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
			header: 'Name',
			cell: (info) => (info.getValue() as number).toString(),
		},
		{
			accessorKey: 'visibleOnMainList',
			header: 'Visible on List',
			cell: (info) => ((info.getValue() as boolean) ? 'Yes' : 'No'),
		},
	]

	const csvFields = [
		{ key: 'name', label: 'Name' },
		{ key: 'type', label: 'Type' },
		{
			key: 'visibleOnMainList',
			label: 'Visible on List',
			accessor: (row) => (row.visibleOnMainList ? 'Yes' : 'No'),
		},
		{ key: 'address', label: 'Address', default: false },
		{ key: 'city', label: 'City', default: false },
		{ key: 'description', label: 'Description', default: false },
	]
</script>

<Table
	{columns}
	rows={filteredRows}
	{globalFilterFn}
	{onRowClick}
	emptyMsg="No venues yet"
	csvFilename="venues"
	{csvFields}
>
	<svelte:fragment slot="filters">
		<select
			bind:value={filterType}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Types</option>
			{#each types as t}
				<option value={t}>{capitalize(t)}</option>
			{/each}
		</select>
		<select
			bind:value={filterVisible}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Visibility</option>
			<option value="yes">Visible</option>
			<option value="no">Hidden</option>
		</select>
	</svelte:fragment>
</Table>
