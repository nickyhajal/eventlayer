<script lang="ts">
	import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'

	import type { Form } from '@matterloop/db'
	import { capitalize, dayjs } from '@matterloop/util'

	export let rows: Form[]

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
			cell: (info) =>
				info.getValue() ? dayjs(info.getValue()).format('MMM. Do [at] h:mma') : '-',
			header: () => 'Starts',
		},
	]

	const csvFields = [
		{ key: 'name', label: 'Name' },
		{ key: 'type', label: 'Type' },
		{ key: 'descr', label: 'Description', default: false },
	]
</script>

<Table
	{columns}
	rows={filteredRows}
	{globalFilterFn}
	{onRowClick}
	emptyMsg="No forms yet"
	csvFilename="forms"
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
	</svelte:fragment>
</Table>
