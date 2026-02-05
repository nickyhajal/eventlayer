<script lang="ts" generics="T">
	import {
		createSvelteTable,
		flexRender,
		getCoreRowModel,
		getFacetedMinMaxValues,
		getFacetedRowModel,
		getFacetedUniqueValues,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type FilterFn,
		type SortDirection,
	} from '@tanstack/svelte-table'
	import type {
		Cell,
		ColumnDef,
		ColumnSort,
		Row,
		SortingColumn,
		TableOptions,
	} from '@tanstack/svelte-table'
	import ArrowDown from 'lucide-svelte/icons/arrow-down'
	import ArrowUp from 'lucide-svelte/icons/arrow-up'
	import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down'
	import ChevronFirst from 'lucide-svelte/icons/chevron-first'
	import ChevronLast from 'lucide-svelte/icons/chevron-last'
	import ChevronLeft from 'lucide-svelte/icons/chevron-left'
	import ChevronRight from 'lucide-svelte/icons/chevron-right'
	import Download from 'lucide-svelte/icons/download'
	import { writable } from 'svelte/store'

	import UserAvatar from '../UserAvatar.svelte'
	import ChicletButton from './ChicletButton.svelte'

	export let emptyMsg: string
	export let sorting: ColumnSort[] = []
	export let rows: Array<T>
	export let columns: ColumnDef<T>[]
	export let globalFilterFn: FilterFn<any>
	export let pageSize = 50
	export let onRowClick: (row: Row<T>) => {}
	export let rowHref: undefined | ((cell: Cell<T, unknown>) => string)
	export let csvFilename = 'export'
	export let csvFields: { key: string; label: string; default?: boolean; accessor?: (row: T) => string }[] = []
	export const numFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

	let csvModalOpen = false
	let csvScope: 'page' | 'all' = 'all'
	let csvSelectedFields: Record<string, boolean> = {}

	function initCsvFields() {
		csvSelectedFields = {}
		for (const f of csvFields) {
			csvSelectedFields[f.key] = f.default !== false
		}
	}

	function openCsvModal() {
		initCsvFields()
		csvModalOpen = true
	}

	function closeCsvModal() {
		csvModalOpen = false
	}

	function downloadCsv() {
		const selected = csvFields.filter((f) => csvSelectedFields[f.key])
		if (!selected.length) return
		const dataRows =
			csvScope === 'page'
				? $table.getRowModel().rows.map((r) => r.original)
				: $table.getPrePaginationRowModel().rows.map((r) => r.original)

		const header = selected.map((f) => `"${f.label}"`).join(',')
		const csvRows = dataRows.map((row) => {
			return selected
				.map((f) => {
					let val = ''
					if (f.accessor) {
						val = f.accessor(row as T)
					} else {
						val = (row as any)?.[f.key] ?? ''
					}
					return `"${String(val).replace(/"/g, '""')}"`
				})
				.join(',')
		})
		const csv = [header, ...csvRows].join('\n')
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${csvFilename}-${csvScope}.csv`
		a.click()
		URL.revokeObjectURL(url)
		closeCsvModal()
	}

	let globalFilter = ''

	const options = writable<TableOptions<T>>({
		data: rows || [],
		columns: columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: globalFilterFn,
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFacetedMinMaxValues: getFacetedMinMaxValues(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			globalFilter,
			pagination: {
				pageSize,
				pageIndex: 0,
			},
		},
		initialState: {
			sorting: sorting || [],
		},
		enableGlobalFilter: true,
	})

	export let table = createSvelteTable(options)

	export function setGlobalFilter(filter: string) {
		setCurrentPage(0)
		globalFilter = filter
		options.update((old) => {
			return {
				...old,
				state: {
					...old.state,
					globalFilter: filter,
				},
			}
		})
	}

	export function setCurrentPage(page: number) {
		options.update((old: any) => {
			return {
				...old,
				state: {
					...old.state,
					pagination: {
						...old.state?.pagination,
						pageIndex: page,
					},
				},
			}
		})
	}

	function setPageSize(e: Event) {
		const target = e.target as HTMLInputElement
		options.update((old: any) => {
			return {
				...old,
				state: {
					...old.state,
					pagination: {
						...old.state?.pagination,
						pageSize: parseInt(target.value),
					},
				},
			}
		})
	}

	let timer: NodeJS.Timeout
	function handleSearch(e: Event) {
		clearTimeout(timer)
		timer = setTimeout(() => {
			const target = e.target as HTMLInputElement
			setGlobalFilter(target.value)
		}, 300)
	}

	function handleCurrPageInput(e: Event) {
		const target = e.target as HTMLInputElement
		setCurrentPage(parseInt(target.value) - 1)
	}

	const noTypeCheck = (x: any) => x

	let headerGroups = $table.getHeaderGroups()
</script>

{#if !rows?.length}
	<div class="mt-6 w-7/12 rounded-xl bg-stone-50 p-6 text-center text-sm text-stone-600">
		{emptyMsg || 'No rows yet'}
	</div>
{:else}
	<div class="mt-4 overflow-hidden rounded-2xl border border-b-2 border-stone-100">
		<div class="columns">
			<div class="column">
				<div
					class="mb-4 flex items-center justify-between border-b border-stone-200/30 bg-stone-100/40 p-1"
				>
					<div class="flex items-center gap-2">
						<slot name="filters" />
					</div>
					<div class="flex items-center gap-2">
						{#if csvFields.length}
							<button
								on:click={openCsvModal}
								class="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
							>
								<Download class="h-3.5 w-3.5" />
								Export CSV
							</button>
						{/if}
						<input
							{...noTypeCheck(null)}
							type="search"
							class="input w-96 border border-stone-100 px-3 py-2"
							on:keyup={handleSearch}
							on:search={handleSearch}
							placeholder="Search..."
						/>
					</div>
				</div>
				<div class="overflow-hidden rounded-2xl">
					<table class="table w-full">
						<thead>
							{#each headerGroups as headerGroup}
								<tr>
									{#each headerGroup.headers as header, i}
										<th
											colSpan={header.colSpan}
											class="px-2 py-1 text-sm font-semibold text-gray-900/50 text-left"
										>
											{#if !header.isPlaceholder}
												<button
													class="flex items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-stone-100 {header.column.getCanSort()
														? 'cursor-pointer select-none'
														: ''}"
													disabled={!header.column.getCanSort()}
													on:click={header.column.getToggleSortingHandler()}
												>
													<svelte:component
														this={flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
													/>
													{#if header.column.getCanSort()}
														{#if header.column.getIsSorted() === 'asc'}
															<ArrowUp class="h-3.5 w-3.5 text-stone-700" />
														{:else if header.column.getIsSorted() === 'desc'}
															<ArrowDown class="h-3.5 w-3.5 text-stone-700" />
														{:else}
															<ArrowUpDown class="h-3.5 w-3.5 text-stone-300" />
														{/if}
													{/if}
												</button>
											{/if}
										</th>
									{/each}
								</tr>
							{/each}
						</thead>
						<tbody>
							{#each $table.getRowModel().rows as row}
								<tr
									class="bg-stone-100/20 font-medium text-gray-800/80 odd:bg-stone-100 cursor-pointer transition-colors hover:bg-sky-50"
									on:click={() => onRowClick(row)}
								>
									{#each row.getVisibleCells() as cell}
										<td class="px-2 py-2.5 text-sm">
											<svelte:element
												this={rowHref ? 'a' : 'div'}
												href={rowHref ? rowHref(cell) : ''}
											>
												{#if cell.getValue()?.startsWith?.('userAvatar')}
													<UserAvatar
														class="h-8 w-8"
														fallbackClass="text-md font-medium text-slate-400"
														user={JSON.parse(cell.getValue().replace('userAvatar:', ''))}
													/>
												{:else if cell.getValue()?.startsWith?.('button:')}
													<ChicletButton
														on:click={(e) =>
															cell
																.getContext()
																.column.columnDef.handleClick(
																	e,
																	cell.getContext().row.original,
																)}
													>
														{cell.getValue().replace('button:', '').trim()}
													</ChicletButton>
												{:else}
													<svelte:component
														this={flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													/>
												{/if}
											</svelte:element>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
					<div class="flex items-center bg-stone-50 p-3 text-xs font-medium text-stone-500">
						<button
							class="button is-white"
							on:click={() => setCurrentPage(0)}
							class:is-disabled={!$table.getCanPreviousPage()}
							disabled={!$table.getCanPreviousPage()}
						>
							<ChevronFirst class="w-5 text-stone-400" />
						</button>
						<button
							class="button is-white"
							on:click={() =>
								setCurrentPage($table.getState().pagination.pageIndex - 1)}
							class:is-disabled={!$table.getCanPreviousPage()}
							disabled={!$table.getCanPreviousPage()}
						>
							<ChevronLeft class="w-5 text-stone-400" />
						</button>
						<span> Page </span>
						<input
							type="number p-1"
							value={$table.getState().pagination.pageIndex + 1}
							min={0}
							max={$table.getPageCount() - 1}
							on:change={handleCurrPageInput}
							class="mx-1"
						/>
						<span>
							{' '}of{' '}
							{$table.getPageCount()}
						</span>
						<button
							class="button is-white"
							on:click={() =>
								setCurrentPage($table.getState().pagination.pageIndex + 1)}
							class:is-disabled={!$table.getCanNextPage()}
							disabled={!$table.getCanNextPage()}
						>
							<ChevronRight class="w-5 text-stone-400" />
						</button>
						<button
							class="button"
							on:click={() => setCurrentPage($table.getPageCount() - 1)}
							class:is-disabled={!$table.getCanNextPage()}
							disabled={!$table.getCanNextPage()}
						>
							<ChevronLast class="w-5 text-stone-400" />
						</button>
						<span class=" mx-2">|</span>
						<select
							value={$table.getState().pagination.pageSize}
							on:change={setPageSize}
							class="select rounded-lg p-1"
						>
							{#each [7, 10, 25, 50] as pageSize}
								<option value={pageSize}>
									Show {pageSize}
								</option>
							{/each}
						</select>
						<span class="mx-2">|</span>
						<span>{$table.getPrePaginationRowModel().rows.length} total rows</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if csvModalOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<div class="absolute inset-0 bg-black/50" on:click={closeCsvModal} />
		<div class="relative z-10 w-full max-w-md rounded-lg border bg-white p-6 shadow-lg">
			<h3 class="mb-4 text-lg font-semibold">Export CSV</h3>
			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-stone-700">Scope</label>
				<div class="flex gap-3">
					<label class="flex items-center gap-2 text-sm">
						<input type="radio" bind:group={csvScope} value="all" class="accent-sky-600" />
						All rows ({$table.getPrePaginationRowModel().rows.length})
					</label>
					<label class="flex items-center gap-2 text-sm">
						<input type="radio" bind:group={csvScope} value="page" class="accent-sky-600" />
						Current page ({$table.getRowModel().rows.length})
					</label>
				</div>
			</div>
			<div class="mb-4">
				<label class="mb-2 block text-sm font-medium text-stone-700">Fields</label>
				<div class="max-h-60 space-y-1.5 overflow-y-auto rounded-md border border-stone-200 p-3">
					{#each csvFields as field}
						<label class="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								bind:checked={csvSelectedFields[field.key]}
								class="accent-sky-600"
							/>
							{field.label}
						</label>
					{/each}
				</div>
			</div>
			<div class="flex justify-end gap-2">
				<button
					on:click={closeCsvModal}
					class="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
				>
					Cancel
				</button>
				<button
					on:click={downloadCsv}
					class="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
				>
					Download CSV
				</button>
			</div>
		</div>
	</div>
{/if}
