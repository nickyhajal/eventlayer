<script lang="ts">
	import { browser } from '$app/environment'
	import { afterNavigate, beforeNavigate, goto } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'
	import * as Dialog from '$lib/components/ui/dialog'
	import Plus from 'lucide-svelte/icons/plus'
	import { tick } from 'svelte'
	import Upload from 'lucide-svelte/icons/upload'

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
	let loading = false
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
	<UserTable rows={data.users} bind:table bind:setCurrentPage bind:setGlobalFilter />
</AdminScreen>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<UserForm simplified={true} inDialog={true} />
	</Dialog.Content>
</Dialog.Root>
