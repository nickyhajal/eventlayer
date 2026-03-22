<script lang="ts">
	import { tick } from 'svelte'

	import type { Snapshot } from '../$types'
	import AdminScreen from '../AdminScreen.svelte'
	import TicketTable from './TicketTable.svelte'

	export let data
	let table: any
	let setCurrentPage: ((page: number) => void) | undefined
	let setGlobalFilter: ((value: string) => void) | undefined

	type TicketWithRelations = (typeof data.tickets)[number]
	type AssignedUserSummary = {
		user: NonNullable<TicketWithRelations['assignedToUser']>
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
		user: NonNullable<TicketWithRelations['user']>
		assignedUsers: AssignedUserSummary[]
	}

	export const snapshot: Snapshot = {
		capture: () => {
			const state = table ? $table?.getState?.() : undefined
			return {
				query: state?.globalFilter ?? '',
				scrollY: window.scrollY,
				page: state?.pagination?.pageIndex ?? 0,
				pageSize: state?.pagination?.pageSize,
				sorting: state?.sorting ?? [],
			}
		},
		restore: async ({ scrollY, page, pageSize, query, sorting }) => {
			await tick()
			if (table) {
				if (Array.isArray(sorting)) {
					$table?.setSorting?.(sorting)
				}
				if (typeof pageSize === 'number') {
					$table?.setPageSize?.(pageSize)
				}
				if (typeof query === 'string' && setGlobalFilter) {
					setGlobalFilter(query)
				}
				if (typeof page === 'number' && setCurrentPage) {
					setCurrentPage(page)
				}
			}
			window.requestAnimationFrame(() => {
				window.scrollTo(0, typeof scrollY === 'number' ? scrollY : 0)
			})
		},
	}

	function getTicketGroupKey(ticket: TicketWithRelations) {
		return [
			ticket.userId,
			ticket.assignKey || 'no-assign-key',
			ticket.type || 'Untyped',
			ticket.status || 'unknown',
		].join(':')
	}

	const ticketsByGroup = data.tickets.reduce<Record<string, TicketTableRow>>((acc, ticket) => {
		if (!ticket.user) {
			return acc
		}

		const key = getTicketGroupKey(ticket)

		if (!acc[key]) {
			acc[key] = {
				id: key,
				assignKey: ticket.assignKey,
				type: ticket.type || 'Untyped',
				status: ticket.status || 'unknown',
				quantity: 0,
				assignedCount: 0,
				unassignedCount: 0,
				user: ticket.user,
				assignedUsers: [],
			}
		}

		acc[key].quantity += 1

		if (ticket.assignedToUser) {
			acc[key].assignedCount += 1

			const existingAssignedUser = acc[key].assignedUsers.find(
				(assignedUser) => assignedUser.user.id === ticket.assignedToUser?.id,
			)

			if (existingAssignedUser) {
				existingAssignedUser.count += 1
				existingAssignedUser.assignedOn ||= ticket.assignedOn || null
			} else {
				acc[key].assignedUsers.push({
					user: ticket.assignedToUser,
					count: 1,
					assignedOn: ticket.assignedOn || null,
				})
			}
		} else {
			acc[key].unassignedCount += 1
		}

		return acc
	}, {})

	const tickets: TicketTableRow[] = Object.values(ticketsByGroup)
		.map((ticket) => ({
			...ticket,
			assignedUsers: [...ticket.assignedUsers].sort((a, b) =>
				`${a.user.firstName || ''} ${a.user.lastName || ''}`.localeCompare(
					`${b.user.firstName || ''} ${b.user.lastName || ''}`,
				),
			),
		}))
		.sort((a, b) =>
			`${a.user.firstName || ''} ${a.user.lastName || ''}`.localeCompare(
				`${b.user.firstName || ''} ${b.user.lastName || ''}`,
			),
		)
</script>

<AdminScreen title="Tickets">
	<TicketTable rows={tickets} bind:table bind:setCurrentPage bind:setGlobalFilter />
</AdminScreen>
