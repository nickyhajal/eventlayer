<script lang="ts">
	import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'

	import type { Sponsor } from '@matterloop/db'
	import { capitalize, dayjs, startCase } from '@matterloop/util'

	export let rows: Sponsor[]

	let filterType = ''

	$: types = [...new Set(rows.map((r) => r.type).filter(Boolean))].sort()

	$: filteredRows = rows.filter((r) => {
		if (filterType && r.type !== filterType) return false
		return true
	})

	const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
		if (!value || value.length === 0) return true
		const colVal = row.getValue(columnId)
		if (!colVal) return false
		return colVal.toString().toLowerCase().includes(value.toLowerCase())
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

	const csvFields = [
		{ key: 'title', label: 'Name' },
		{ key: 'type', label: 'Type' },
		{ key: 'url', label: 'URL', default: false },
		{ key: 'description', label: 'Description', default: false },
		{ key: 'ord', label: 'Order', default: false },
	]
</script>

<Table
	sorting={[{ id: 'ord', desc: false }]}
	{columns}
	rows={filteredRows}
	{globalFilterFn}
	{onRowClick}
	emptyMsg="No sponsors yet"
	csvFilename="sponsors"
	{csvFields}
>
	<svelte:fragment slot="filters">
		<select
			bind:value={filterType}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Types</option>
			{#each types as t}
				<option value={t}>{startCase(t)}</option>
			{/each}
		</select>
	</svelte:fragment>
</Table>
