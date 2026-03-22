<script lang="ts">
	import type { ColumnDef, Row } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { invalidateAll } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'
	import { trpc } from '$lib/trpc/client'

	import type { User } from '@matterloop/db'
	import { copyToClipboard, dayjs, plural, startCase } from '@matterloop/util'

	type AssignedUserSummary = {
		user: User
		count: number
		assignedOn: string | null
	}

	type TicketTableRow = {
		id: string
		assignKey: string | null
		type: string
		status: string
		quantity: number
		assignedCount: number
		unassignedCount: number
		user: User
		assignedUsers: AssignedUserSummary[]
	}

	export let rows: TicketTableRow[]
	export let table: any
	export let setCurrentPage: any
	export let setGlobalFilter: any

	type ActionColumnDef = ColumnDef<TicketTableRow> & {
		handleClick?: (e: Event, row: TicketTableRow) => void
	}

	let filterStatus = ''
	let filterType = ''
	let filterAssignment = ''
	let selectedRowId: string | null = null

	$: statuses = [...new Set(rows.map((r) => r.status).filter(Boolean))].sort()
	$: ticketTypes = [...new Set(rows.map((r) => r.type).filter(Boolean))].sort()

	$: filteredRows = rows.filter((r) => {
		if (filterStatus && r.status !== filterStatus) return false
		if (filterType && r.type !== filterType) return false
		if (filterAssignment === 'unassigned' && r.assignedCount > 0) return false
		if (filterAssignment === 'partially-assigned' && !(r.assignedCount > 0 && r.unassignedCount > 0)) {
			return false
		}
		if (filterAssignment === 'fully-assigned' && r.unassignedCount > 0) return false
		return true
	})

	$: selectedRow = rows.find((row) => row.id === selectedRowId) || null
	$: if (selectedRowId && !filteredRows.some((row) => row.id === selectedRowId)) {
		selectedRowId = null
	}

	const globalFilterFn: FilterFn<any> = (row, columnId, value) => {
		if (!value || value.length === 0) return true
		const colVal = row.getValue(columnId)
		if (!colVal) return false
		return colVal.toString().toLowerCase().includes(value.toLowerCase())
	}

	const onRowClick = (row: Row<TicketTableRow>) => {
		if (!row.original.assignedUsers.length) {
			selectedRowId = null
			return
		}

		selectedRowId = selectedRowId === row.original.id ? null : row.original.id
	}

	function copyTicketLink(e: Event, row: TicketTableRow) {
		e.preventDefault()
		e.stopPropagation()

		if (!row.assignKey || row.unassignedCount === 0) {
			return
		}

		const elm = e.currentTarget as HTMLButtonElement
		const tmp = elm.textContent
		elm.textContent = 'Copied!'
		setTimeout(() => {
			elm.textContent = tmp
		}, 1000)

		const url = `${window.location.origin}/welcome/${row.assignKey}`
		copyToClipboard(url)
	}

	let confirmingSend = false
	async function sendClaimEmail(e: Event, row: TicketTableRow) {
		e.preventDefault()
		e.stopPropagation()

		const elm = e.currentTarget as HTMLButtonElement
		if (!confirmingSend) {
			confirmingSend = true
			const tmp = elm.textContent
			elm.textContent = 'Again to Confirm'
			setTimeout(() => {
				elm.textContent = row.status === 'sent' ? 'Send Email Again' : 'Send Email'
				confirmingSend = false
			}, 700)
		} else if (confirmingSend) {
			if (!row.assignKey || row.unassignedCount === 0) {
				return
			}

			elm.textContent = 'Sending...'
			await trpc().user.sendAssignEmail.mutate({ assignKey: row.assignKey })
			elm.textContent = 'Sent!'
			setTimeout(() => {
				elm.textContent = 'Send Email Again'
				confirmingSend = false
			}, 1000)
			invalidateAll()
		}
	}

	function getAssignmentLabel(row: TicketTableRow) {
		if (row.assignedCount === 0) {
			return 'Unassigned'
		}

		if (row.unassignedCount === 0) {
			return `${row.assignedCount}/${row.quantity} assigned`
		}

		return `${row.assignedCount}/${row.quantity} assigned`
	}

	const columns: ActionColumnDef[] = [
		{
			accessorKey: 'photo',
			header: 'Photo',
			accessorFn: (row) => `userAvatar:${JSON.stringify(row.user)}`,
			enableSorting: false,
		},
		{
			accessorKey: 'type',
			header: 'Type',
			accessorFn: (row) => row.type,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => startCase(info.getValue<string>()),
			filterFn: globalFilterFn,
		},
		{
			accessorKey: 'quantity',
			header: 'Quantity',
			cell: (info) => info.getValue<number>(),
		},
		{
			accessorKey: 'assigned',
			header: 'Assigned',
			accessorFn: (row) =>
				[
					getAssignmentLabel(row),
					row.assignedUsers.length
						? row.assignedUsers.map((assignedUser) => assignedUser.user.email).join(' ')
						: '',
				].join(' '),
			cell: (info) => {
				const row = info.row.original
				return row.assignedUsers.length
					? `${getAssignmentLabel(row)} (click row)`
					: getAssignmentLabel(row)
			},
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
		{
			accessorKey: 'email-action',
			header: 'Send Email',
			handleClick: (e, row) => sendClaimEmail(e, row),
			accessorFn: (row) =>
				row.unassignedCount > 0
					? `button: ${row.status === 'sent' ? 'Send Email Again' : 'Send Email'}`
					: '',
			enableSorting: false,
		},
		{
			accessorKey: 'copy-link',
			header: 'Copy Link',
			handleClick: (e, row) => copyTicketLink(e, row),
			accessorFn: (row) => (row.unassignedCount > 0 ? 'button: Copy Link' : ''),
			enableSorting: false,
		},
	]

	const csvFields = [
		{
			key: 'purchaser',
			label: 'Purchaser',
			accessor: (row: TicketTableRow) => `${row.user?.firstName || ''} ${row.user?.lastName || ''}`,
		},
		{ key: 'email', label: 'Email', accessor: (row: TicketTableRow) => row.user?.email || '' },
		{ key: 'status', label: 'Status' },
		{ key: 'quantity', label: 'Quantity' },
		{ key: 'type', label: 'Type' },
		{
			key: 'assignedSummary',
			label: 'Assignment',
			accessor: (row: TicketTableRow) => getAssignmentLabel(row),
		},
	]
</script>

<Table
	{columns}
	rows={filteredRows}
	sorting={[
		{ id: 'purchaser', desc: false },
		{ id: 'type', desc: false },
	]}
	pageSize={25}
	{globalFilterFn}
	bind:table
	bind:setCurrentPage
	bind:setGlobalFilter
	{onRowClick}
	emptyMsg="No tickets yet"
	csvFilename="tickets"
	{csvFields}
>
	<svelte:fragment slot="filters">
		<select
			bind:value={filterAssignment}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Assignment States</option>
			<option value="unassigned">Unassigned</option>
			<option value="partially-assigned">Partially Assigned</option>
			<option value="fully-assigned">Fully Assigned</option>
		</select>
		<select
			bind:value={filterType}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Ticket Types</option>
			{#each ticketTypes as ticketType}
				<option value={ticketType}>{ticketType}</option>
			{/each}
		</select>
		<select
			bind:value={filterStatus}
			class="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-600"
		>
			<option value="">All Statuses</option>
			{#each statuses as s}
				<option value={s}>{startCase(s)}</option>
			{/each}
		</select>
	</svelte:fragment>
</Table>

{#if selectedRow && selectedRow.assignedUsers.length}
	<div class="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
		<div class="flex items-start justify-between gap-4 border-b border-stone-100 pb-3">
			<div>
				<div class="text-sm font-semibold text-stone-900">
					Assigned {selectedRow.type} tickets
				</div>
				<div class="mt-1 text-sm text-stone-500">
					{selectedRow.user.firstName} {selectedRow.user.lastName} purchased {selectedRow.quantity}
					{plural(selectedRow.quantity, 'ticket')}. {selectedRow.assignedCount} assigned, {selectedRow.unassignedCount}
					unassigned.
				</div>
			</div>
			<div class="text-xs font-medium uppercase tracking-wide text-stone-400">
				{selectedRow.assignedUsers.length} recipient{selectedRow.assignedUsers.length === 1 ? '' : 's'}
			</div>
		</div>

		<div class="divide-y divide-stone-100">
			{#each selectedRow.assignedUsers as assignedUser}
				<a
					href={`/manage/people/${assignedUser.user.id}`}
					class="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-stone-50"
				>
					<div>
						<div class="text-sm font-medium text-stone-900">
							{assignedUser.user.firstName} {assignedUser.user.lastName}
						</div>
						<div class="text-sm text-stone-500">{assignedUser.user.email}</div>
					</div>
					<div class="text-right text-sm text-stone-500">
						<div>{assignedUser.count} {plural(assignedUser.count, 'ticket')}</div>
						{#if assignedUser.assignedOn}
							<div class="text-xs text-stone-400">
								Assigned {dayjs(assignedUser.assignedOn).format('MMM D, YYYY h:mm A')}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</div>
{/if}
