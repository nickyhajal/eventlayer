<script lang="ts">
	import type { ColumnDef, Row } from '@tanstack/svelte-table'
	import type { FilterFn } from '@tanstack/svelte-table'

	import Table from '$lib/components/ui/Table.svelte'

	import type { EventSponsorConnection, User } from '@matterloop/db'
	import { dayjs } from '@matterloop/util'

	type SponsorLeadRow = EventSponsorConnection & {
		user?: User | null
	}

	export let rows: SponsorLeadRow[] = []

	const globalFilterFn: FilterFn<any> = (row, columnId, value) => {
		if (!value || value.length === 0) return true
		const colVal = row.getValue(columnId)
		if (!colVal) return false
		return colVal.toString().toLowerCase().includes(value.toLowerCase())
	}

	const onRowClick = (_row: Row<SponsorLeadRow>) => ({})

	const columns: ColumnDef<SponsorLeadRow>[] = [
		{
			accessorKey: 'attendee',
			header: 'Attendee',
			accessorFn: (row) => {
				return `${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim() || 'Unknown'
			},
		},
		{
			accessorKey: 'email',
			header: 'Email',
			accessorFn: (row) => row.user?.email || '',
		},
		{
			accessorKey: 'source',
			header: 'Source',
			cell: (info) => info.getValue() || 'manual',
		},
		{
			accessorKey: 'createdAt',
			header: 'Hearted At',
			cell: (info) => {
				const value = info.getValue() as string | undefined
				return value ? dayjs(value).format('MMM D, YYYY h:mma') : ''
			},
		},
	]

	const csvFields = [
		{
			key: 'attendee',
			label: 'Attendee',
			accessor: (row: SponsorLeadRow) =>
				`${row.user?.firstName || ''} ${row.user?.lastName || ''}`.trim(),
		},
		{ key: 'email', label: 'Email', accessor: (row: SponsorLeadRow) => row.user?.email || '' },
		{ key: 'source', label: 'Source', accessor: (row: SponsorLeadRow) => row.source || 'manual' },
		{
			key: 'createdAt',
			label: 'Hearted At',
			accessor: (row: SponsorLeadRow) =>
				row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
		},
	]
</script>

<Table
	{columns}
	{rows}
	sorting={[{ id: 'createdAt', desc: true }]}
	pageSize={25}
	{globalFilterFn}
	{onRowClick}
	rowHref={undefined}
	emptyMsg="No sponsor hearts yet"
	csvFilename="sponsor-leads"
	{csvFields}
/>
