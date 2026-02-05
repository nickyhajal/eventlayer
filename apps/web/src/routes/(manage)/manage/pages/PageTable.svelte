<script lang="ts">
	import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'

	import type { Form } from '@matterloop/db'
	import { capitalize, dayjs } from '@matterloop/util'

	export let rows: Page[]

	let filterStatus = ''

	$: statuses = [...new Set(rows.map((r) => r.status).filter(Boolean))].sort()

	$: filteredRows = rows.filter((r) => {
		if (filterStatus && r.status !== filterStatus) return false
		return true
	})

	const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
		if (!value || value.length === 0) return true
		const colVal = row.getValue(columnId)
		if (!colVal) return false
		return colVal.toString().toLowerCase().includes(value.toLowerCase())
	}
	const onRowClick = (row: Row<Event>) => {
		goto(`/manage/pages/${row.original.id}`)
	}

	const columns: ColumnDef<Form>[] = [
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => capitalize(info.getValue()),
			filterFn: globalFilterFn,
		},
		{
			accessorKey: 'title',
			header: 'Title',
			filterFn: globalFilterFn,
			cell: (info) => info.getValue().toString(),
		},
		{
			accessorKey: 'path',
			header: 'Path',
			cell: (info) => `/${info.getValue()}`,
			filterFn: globalFilterFn,
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
		{ key: 'title', label: 'Title' },
		{ key: 'path', label: 'Path' },
		{ key: 'status', label: 'Status' },
		{ key: 'body', label: 'Body', default: false },
	]
</script>

<Table
	{columns}
	rows={filteredRows}
	{globalFilterFn}
	{onRowClick}
	emptyMsg="No pages yet"
	csvFilename="pages"
	{csvFields}
>
	<svelte:fragment slot="filters">
		<select
			bind:value={filterStatus}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Statuses</option>
			{#each statuses as s}
				<option value={s}>{capitalize(s)}</option>
			{/each}
		</select>
	</svelte:fragment>
</Table>
