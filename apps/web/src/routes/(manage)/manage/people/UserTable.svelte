<script lang="ts">
	import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'

	import type { User } from '@matterloop/db'
	import { capitalize, dayjs, getMediaUrl, startCase } from '@matterloop/util'

	export let rows: User[]
	export let table
	export let setCurrentPage
	export let setGlobalFilter

	let filterType = ''
	let filterOnboard = ''

	$: types = [...new Set(rows.map((r) => r.type).filter(Boolean))].sort()
	$: onboardStatuses = [...new Set(rows.map((r) => r.onboardStatus).filter(Boolean))].sort()

	$: filteredRows = rows.filter((r) => {
		if (!r.firstName) return false
		if (filterType && r.type !== filterType) return false
		if (filterOnboard && r.onboardStatus !== filterOnboard) return false
		return true
	})

	const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
		if (!value || value.length === 0) return true
		const colVal = row.getValue(columnId)
		if (!colVal) return false
		return colVal.toString().toLowerCase().includes(value.toLowerCase())
	}
	const onRowClick = (row: Row<Event>) => {
		goto(`/manage/people/${row.original.id}`)
	}

	const columns: ColumnDef<User>[] = [
		{
			accessorKey: 'photo',
			header: 'Photo',
			accessorFn: (row) => `userAvatar:${JSON.stringify(row)}`,
			enableSorting: false,
		},
		{
			accessorKey: 'type',
			header: 'Type',
			cell: (info) => startCase(info.getValue()),
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
		{
			accessorKey: 'email',
			header: 'E-Mail Address',
			cell: (info) => info.getValue().toString(),
		},
		{
			accessorKey: 'linkedin',
			header: 'LinkedIn',
			accessorFn: (row) =>
				(row?.info?.['linkedin_url']?.value || '').replace('https://www.linkedin.com/', ''),
		},
		{
			accessorKey: 'onboardStatus',
			header: 'Onboarding',
			cell: (info) => startCase(info.getValue()),
		},
	]

	const csvFields = [
		{ key: 'firstName', label: 'First Name' },
		{ key: 'lastName', label: 'Last Name' },
		{ key: 'email', label: 'Email' },
		{ key: 'type', label: 'Type' },
		{ key: 'company', label: 'Company' },
		{ key: 'title', label: 'Title' },
		{
			key: 'linkedin',
			label: 'LinkedIn',
			accessor: (row) =>
				row?.info?.['linkedin_url']?.value || '',
		},
		{ key: 'onboardStatus', label: 'Onboard Status' },
		{ key: 'bio', label: 'Bio', default: false },
		{ key: 'url', label: 'URL', default: false },
	]
</script>

<Table
	{columns}
	rows={filteredRows}
	sorting={[{ id: 'lastName', desc: false }]}
	pageSize={25}
	{globalFilterFn}
	bind:table
	bind:setCurrentPage
	bind:setGlobalFilter
	{onRowClick}
	rowHref={(cell) => `/manage/people/${cell.getContext().row.original.id}`}
	emptyMsg="No people yet"
	csvFilename="users"
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
		<select
			bind:value={filterOnboard}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Onboard Status</option>
			{#each onboardStatuses as s}
				<option value={s}>{startCase(s)}</option>
			{/each}
		</select>
	</svelte:fragment>
</Table>
