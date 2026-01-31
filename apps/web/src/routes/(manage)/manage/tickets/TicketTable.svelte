<script lang="ts">
	import type { ColumnDef, Row, TableOptions } from '@tanstack/svelte-table'
	import { type FilterFn } from '@tanstack/svelte-table'
	import { goto, invalidateAll } from '$app/navigation'
	import Table from '$lib/components/ui/Table.svelte'
	import { trpc } from '$lib/trpc/client'

	import type { EventTicket, User } from '@matterloop/db'
	import { capitalize, copyToClipboard, dayjs, getMediaUrl, startCase } from '@matterloop/util'

	export let rows: User[]
	export let table
	export let setCurrentPage
	export let setGlobalFilter

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
		// goto(`/manage/people/${row.original.id}`)
	}

	function copyTicketLink(e: Event, row: EventTicket) {
		e.preventDefault()
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
	async function sendClaimEmail(e: Event, row: EventTicket) {
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
			if (!row.assignKey) {
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

	const columns: ColumnDef<User>[] = [
		{
			accessorKey: 'photo',
			header: 'Photo',
			accessorFn: (row) => `userAvatar:${JSON.stringify(row.user)}`,
			enableSorting: false,
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
		{
			accessorKey: 'email-actin',
			header: 'Send Email',
			handleClick: (e, row) => sendClaimEmail(e, row),
			accessorFn: (row) =>
				`button: ${row.status === 'sent' ? 'Send Email Again' : 'Send Email'}`,
			enableSorting: false,
		},
		{
			accessorKey: 'copy-link',
			header: 'Copy Link',
			handleClick: (e, row) => copyTicketLink(e, row),
			accessorFn: (row) => `button: Copy Link`,
			enableSorting: false,
		},
	]

	const csvFields = [
		{
			key: 'purchaser',
			label: 'Purchaser',
			accessor: (row) => `${row.user?.firstName || ''} ${row.user?.lastName || ''}`,
		},
		{ key: 'email', label: 'Email', accessor: (row) => row.user?.email || '' },
		{ key: 'status', label: 'Status' },
		{ key: 'quantity', label: 'Quantity' },
		{ key: 'type', label: 'Type', default: false },
	]
</script>

<Table
	{columns}
	rows={filteredRows}
	sorting={[{ id: 'purchaser', desc: false }]}
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
