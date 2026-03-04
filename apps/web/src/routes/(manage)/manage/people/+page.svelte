<script lang="ts">
	import { browser } from '$app/environment'
	import { afterNavigate, beforeNavigate, goto, invalidateAll } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import { trpc } from '$lib/trpc/client'
	import Plus from 'lucide-svelte/icons/plus'
	import { tick } from 'svelte'
	import Upload from 'lucide-svelte/icons/upload'

	import type { User } from '@matterloop/db'
	import type { Snapshot } from './$types'
	import AdminScreen from '../AdminScreen.svelte'
	import UserForm from './UserForm.svelte'
	import UserTable from './UserTable.svelte'

	export let data
	let table
	let setCurrentPage
	let setGlobalFilter
	const PEOPLE_TABLE_STATE_KEY = 'manage:people:table-state-v1'
	let pendingRestore:
		| {
				query?: string
				scrollY?: number
				page?: number
				pageSize?: number
				sorting?: any[]
		  }
		| null = null

	type PeopleSnapshotState = {
		query: string
		scrollY: number
		page: number
		pageSize?: number
		sorting: any[]
	}

	function capturePeopleTableState(): PeopleSnapshotState {
		const state = table ? $table.getState() : undefined
		return {
			query: state?.globalFilter ?? '',
			scrollY: window.scrollY,
			page: state?.pagination?.pageIndex ?? 0,
			pageSize: state?.pagination?.pageSize,
			sorting: Array.isArray(state?.sorting) ? state.sorting : [],
		}
	}

	function persistPeopleTableState() {
		if (!browser) return
		sessionStorage.setItem(PEOPLE_TABLE_STATE_KEY, JSON.stringify(capturePeopleTableState()))
	}

	async function applyPeopleTableState(state?: {
		query?: string
		scrollY?: number
		page?: number
		pageSize?: number
		sorting?: any[]
	}) {
		if (!state) return
		pendingRestore = state
		await tick()
		tryApplyPeopleTableState()
	}

	function tryApplyPeopleTableState() {
		if (!pendingRestore || !table) return
		const { scrollY, page, pageSize, query, sorting } = pendingRestore
		if (Array.isArray(sorting)) {
			$table.setSorting(sorting)
		}
		if (typeof pageSize === 'number') {
			$table.setPageSize(pageSize)
		}
		if (typeof query === 'string' && typeof setGlobalFilter === 'function') {
			setGlobalFilter(query)
		}
		if (typeof page === 'number' && typeof setCurrentPage === 'function') {
			setCurrentPage(page)
		}
		pendingRestore = null
		window.requestAnimationFrame(() => {
			window.scrollTo(0, typeof scrollY === 'number' ? scrollY : 0)
		})
	}

	$: if (pendingRestore && table) {
		tryApplyPeopleTableState()
	}

	let addOpen = false
	let sendWelcomeOpen = false
	let sendWelcomeState: 'idle' | 'sending' | 'sent' = 'idle'
	let currentPageUsers: User[] = []
	let usersWithoutWelcomeEmail: User[] = []

	$: currentPageUsers = table ? ($table.getRowModel().rows.map((r) => r.original) as User[]) : []
	$: usersWithoutWelcomeEmail = currentPageUsers.filter(
		(user) => user.onboardStatus === 'not-sent' && user.userId,
	)

	function openSendWelcomeModal() {
		sendWelcomeState = 'idle'
		sendWelcomeOpen = true
	}

	function closeSendWelcomeModal() {
		if (sendWelcomeState === 'sending') return
		sendWelcomeOpen = false
		sendWelcomeState = 'idle'
	}

	async function sendWelcomeEmailsForCurrentPage() {
		if (sendWelcomeState === 'sending' || !usersWithoutWelcomeEmail.length) return
		sendWelcomeState = 'sending'
		try {
			await trpc().user.sendWelcomeEmails.mutate({
				userIds: usersWithoutWelcomeEmail.map((user) => user.userId),
			})
			await invalidateAll()
			sendWelcomeState = 'sent'
			setTimeout(() => {
				sendWelcomeOpen = false
				sendWelcomeState = 'idle'
			}, 450)
		} catch (err) {
			console.error('Failed to send welcome emails', err)
			sendWelcomeState = 'idle'
		}
	}

	export const snapshot: Snapshot = {
		capture: () => {
			const snapshotState = capturePeopleTableState()
			persistPeopleTableState()
			return snapshotState
		},
		restore: async ({ scrollY, page, pageSize, query, sorting }) => {
			await applyPeopleTableState({ scrollY, page, pageSize, query, sorting })
		},
	}

	beforeNavigate(() => {
		if (table) {
			persistPeopleTableState()
		}
	})

	afterNavigate((nav) => {
		if (!browser) return
		const fromPath = nav.from?.url.pathname ?? ''
		const cameFromUserDetail = /^\/manage\/people\/[^/]+$/.test(fromPath)
		if (nav.type !== 'popstate' && !cameFromUserDetail) return
		const raw = sessionStorage.getItem(PEOPLE_TABLE_STATE_KEY)
		if (!raw) return
		try {
			void applyPeopleTableState(JSON.parse(raw))
		} catch {
			// Ignore malformed state and continue.
		}
	})
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-5" slot="title">
		<div class="text-2xl font-semibold">Users</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => (addOpen = true)}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add User</Button
		>
		<Button
			variant="outline"
			class="h-7 py-[0.3rem] pl-1.5 pr-3"
			on:click={() => goto('/manage/import')}
		>
			<Upload class="mr-1 w-[1rem] text-slate-700" />
			Import Users
		</Button>
	</div>
	<UserTable
		rows={data.users}
		bind:table
		bind:setCurrentPage
		bind:setGlobalFilter
		onSendWelcomeClick={openSendWelcomeModal}
	/>
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<UserForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={sendWelcomeOpen}>
	<Dialog.Content class="sm:max-w-[560px]">
		<div class="space-y-4">
			<div class="text-xl font-semibold">Send Welcome Email</div>
			<div class="text-sm text-stone-700">
				Are you sure you want to send the Welcome Email to
				<strong>{usersWithoutWelcomeEmail.length} {usersWithoutWelcomeEmail.length === 1 ? 'User' : 'Users'}</strong
				>?
			</div>
			{#if usersWithoutWelcomeEmail.length}
				<div class="max-h-72 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50 p-3">
					<div class="space-y-1.5 text-sm text-stone-700">
						{#each usersWithoutWelcomeEmail as user}
							<div>
								<span class="font-medium"
									>{`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email}</span
								>
								<span class="text-stone-500"> ({user.email})</span>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-600">
					No users on the current page are pending a welcome email.
				</div>
			{/if}
			<div class="flex justify-end gap-2">
				<Button
					variant="outline"
					class="h-9"
					disabled={sendWelcomeState === 'sending'}
					on:click={closeSendWelcomeModal}
				>
					Cancel
				</Button>
				<Button
					class="h-9"
					disabled={sendWelcomeState !== 'idle' || !usersWithoutWelcomeEmail.length}
					on:click={sendWelcomeEmailsForCurrentPage}
				>
					{#if sendWelcomeState === 'sending'}
						Sending...
					{:else if sendWelcomeState === 'sent'}
						Sent!
					{:else}
						Send
					{/if}
				</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
