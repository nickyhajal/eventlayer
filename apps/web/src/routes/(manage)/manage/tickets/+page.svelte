<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import Plus from 'lucide-svelte/icons/plus'
	import { set } from 'zod'

	import type { Snapshot } from '../$types'
	import AdminScreen from '../AdminScreen.svelte'
	import TicketTable from './TicketTable.svelte'
	import UserForm from './UserForm.svelte'

	export let data
	let table
	let setCurrentPage
	let setGlobalFilter

	let addOpen = false
	let loading = false
	export const snapshot: Snapshot = {
		capture: () => {
			return {
				query: $table.getState().globalFilter,
				scrollY: window.scrollY,
				page: $table.getState().pagination.pageIndex,
			}
		},
		restore: ({ scrollY, page, query }) => {
			window.scrollTo(0, scrollY)
			if (page) {
				setCurrentPage(page)
			}
			if (query) {
				setGlobalFilter(query)
			}
		},
	}
	const ticketsByUser = data.tickets.reduce((acc, ticket) => {
		const userId = ticket.user.id
		if (acc[userId]) {
			acc[userId].quantity += 1
		} else {
			acc[userId] = {
				...ticket,
				quantity: 1,
			}
		}
		return acc
	}, {})
	const tickets = Object.values(ticketsByUser)
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-5" slot="title">
		<div class="text-2xl font-semibold">Tickets</div>
		<!-- <Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => (addOpen = true)}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add User</Button
		> -->
	</div>
	<TicketTable rows={tickets} bind:table bind:setCurrentPage bind:setGlobalFilter />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<UserForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
