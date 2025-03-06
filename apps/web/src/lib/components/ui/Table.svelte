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
	import { User } from 'lucide-static'
	import ChevronFirst from 'lucide-svelte/icons/chevron-first'
	import ChevronLast from 'lucide-svelte/icons/chevron-last'
	import ChevronLeft from 'lucide-svelte/icons/chevron-left'
	import ChevronRight from 'lucide-svelte/icons/chevron-right'
	// import { rankItem } from '@tanstack/match-sorter-utils';
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
	export const numFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

	function getSortSymbol(isSorted: boolean | SortDirection) {
		return isSorted ? (isSorted === 'asc' ? '🔼' : '🔽') : ''
	}

	// Rank the item
	// const itemRank = rankItem(row.getValue(columnId), value);

	// Store the itemRank info
	// addMeta({
	// 	itemRank,
	// })

	// Return if the item should be filtered in/out
	// return itemRank.passed

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
			<!-- <div class="column is-one-fifth">
        <h2 class="is-size-3 mb-3">Filters</h2>
  
        {#each headerGroups as headerGroup}
          {#each headerGroup.headers as header}
            {#if header.column.id === 'country'}
              <details open>
                <summary>
                  <h3 class="has-text-weight-semibold is-inline-block">Countries</h3></summary
                >
  
                <FacetCheckboxes table={$table} column={header.column} />
              </details>
            {:else if header.column.id === 'state'}
              <details open>
                <summary> <h3 class="has-text-weight-semibold is-inline-block">State</h3></summary>
  
                <FacetCheckboxes table={$table} column={header.column} />
              </details>
            {:else if header.column.id === 'total'}
              <details open>
                <summary> <h3 class="has-text-weight-semibold is-inline-block">Total</h3></summary>
  
                <FacetMinMax table={$table} column={header.column} />
              </details>
            {/if}
          {/each}
        {/each}
      </div> -->
			<div class="column">
				<div class="mb-4 flex justify-end border-b border-stone-200/30 bg-stone-100/40 p-1">
					<input
						{...noTypeCheck(null)}
						type="search"
						class="input w-96 border border-stone-100 px-3 py-2"
						on:keyup={handleSearch}
						on:search={handleSearch}
						placeholder="Search..."
					/>
				</div>
				<div class="overflow-hidden rounded-2xl">
					<table class="table w-full">
						<thead>
							{#each headerGroups as headerGroup}
								<tr>
									{#each headerGroup.headers as header, i}
										<th
											colSpan={header.colSpan}
											class="px-2 py-1 text-sm font-semibold text-gray-900/50 {i === 0
												? 'text-left'
												: 'text-left'}"
										>
											{#if !header.isPlaceholder}
												<button
													class="button bg-white"
													class:is-disabled={!header.column.getCanSort()}
													disabled={!header.column.getCanSort()}
													on:click={header.column.getToggleSortingHandler()}
												>
													<svelte:component
														this={flexRender(header.column.columnDef.header, header.getContext())}
													/>
													<span class="pl-1">
														{getSortSymbol(header.column.getIsSorted())}
													</span>
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
									class="bg-stone-100/20 font-medium text-gray-800/80 odd:bg-stone-100"
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
																.column.columnDef.handleClick(e, cell.getContext().row.original)}
													>
														{cell.getValue().replace('button:', '').trim()}
													</ChicletButton>
												{:else}
													<svelte:component
														this={flexRender(cell.column.columnDef.cell, cell.getContext())}
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
							on:click={() => setCurrentPage($table.getState().pagination.pageIndex - 1)}
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
							on:click={() => setCurrentPage($table.getState().pagination.pageIndex + 1)}
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
