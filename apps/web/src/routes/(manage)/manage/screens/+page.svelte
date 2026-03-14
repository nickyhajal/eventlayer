<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'
	import Input from '$lib/components/ui/input/input.svelte'
	import { Textarea } from '$lib/components/ui/textarea'
	import { trpc } from '$lib/trpc/client'
	import Plus from 'lucide-svelte/icons/plus'
	import { toast } from 'svelte-sonner'

	import AdminScreen from '../AdminScreen.svelte'

	export let data

	type ScreenConfigForm = {
		mode: 'upcoming_events' | 'message'
		notificationEnabled: boolean
		notificationMessage: string
		notificationPosition: 'top' | 'bottom'
		messageBody: string
	}

	type ScreenRowForm = {
		id: string
		key: string
		name: string
		status: 'active' | 'inactive'
		hasOverride: boolean
		config: ScreenConfigForm
	}

	function toConfigForm(config: any): ScreenConfigForm {
		return {
			mode: config?.mode === 'message' ? 'message' : 'upcoming_events',
			notificationEnabled: !!config?.notificationEnabled,
			notificationMessage: config?.notificationMessage || '',
			notificationPosition: config?.notificationPosition === 'bottom' ? 'bottom' : 'top',
			messageBody: config?.messageBody || '',
		}
	}

	function toConfigPayload(config: ScreenConfigForm) {
		return {
			mode: config.mode,
			notificationEnabled: config.notificationEnabled,
			notificationMessage: config.notificationMessage?.trim() || null,
			notificationPosition: config.notificationPosition,
			messageBody: config.messageBody?.trim() || null,
		}
	}

	let globalConfig: ScreenConfigForm = toConfigForm(data.global.config)

	let rows: ScreenRowForm[] = data.screens.map((screen) => ({
		id: screen.id,
		key: screen.key,
		name: screen.name,
		status: screen.status === 'inactive' ? 'inactive' : 'active',
		hasOverride: !!screen.config,
		config: toConfigForm(screen.config || data.global.config),
	}))

	let savingGlobal = false
	let creating = false
	let rowSaving = ''
	let overrideSaving = ''

	function getErrorMessage(e: unknown, fallback: string) {
		if (typeof e === 'object' && e && 'message' in e && typeof e.message === 'string') {
			return e.message
		}
		return fallback
	}

	async function saveGlobalConfig() {
		try {
			savingGlobal = true
			await trpc().screen.upsertGlobalConfig.mutate(toConfigPayload(globalConfig))
			toast.success('Saved global screen defaults')
		} catch (e) {
			toast.error(getErrorMessage(e, 'Failed to save global defaults'))
		} finally {
			savingGlobal = false
		}
	}

	async function createScreen() {
		try {
			creating = true
			const created = await trpc().screen.create.mutate({})
			rows = [
				...rows,
				{
					id: created.id,
					key: created.key,
					name: created.name,
					status: created.status === 'inactive' ? 'inactive' : 'active',
					hasOverride: false,
					config: toConfigForm(globalConfig),
				},
			]
			toast.success(`Created screen ${created.key}`)
		} catch (e) {
			toast.error(getErrorMessage(e, 'Failed to create screen'))
		} finally {
			creating = false
		}
	}

	async function saveScreenMeta(row: ScreenRowForm) {
		try {
			rowSaving = row.id
			await trpc().screen.update.mutate({
				id: row.id,
				name: row.name?.trim() || `Screen ${row.key}`,
				status: row.status,
			})
			toast.success(`Saved screen ${row.key}`)
		} catch (e) {
			toast.error(getErrorMessage(e, 'Failed to save screen'))
		} finally {
			rowSaving = ''
		}
	}

	async function saveOverride(row: ScreenRowForm) {
		try {
			overrideSaving = row.id
			await trpc().screen.upsertScreenConfig.mutate({
				screenId: row.id,
				config: toConfigPayload(row.config),
			})
			row.hasOverride = true
			toast.success(`Saved override for screen ${row.key}`)
		} catch (e) {
			toast.error(getErrorMessage(e, 'Failed to save override'))
		} finally {
			overrideSaving = ''
		}
	}

	async function clearOverride(row: ScreenRowForm) {
		try {
			overrideSaving = row.id
			await trpc().screen.clearScreenConfig.mutate({ screenId: row.id })
			row.hasOverride = false
			row.config = toConfigForm(globalConfig)
			toast.success(`Cleared override for screen ${row.key}`)
		} catch (e) {
			toast.error(getErrorMessage(e, 'Failed to clear override'))
		} finally {
			overrideSaving = ''
		}
	}

	async function refresh() {
		await invalidateAll()
	}
</script>

<AdminScreen title="Screens">
	<div class="flex items-center gap-4" slot="title">
		<Button
			variant="outline"
			class="h-7 py-[0.3rem] pl-1.5 pr-3"
			on:click={createScreen}
			disabled={creating}
		>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			{creating ? 'Creating...' : 'Add Screen'}
		</Button>
	</div>

	<div class="rounded-xl border border-stone-200 bg-stone-50 p-4">
		<div class="mb-3 text-lg font-semibold text-stone-700">Global Screen State</div>
		<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-600">
				<span>Mode</span>
				<select class="rounded-md border border-stone-200 bg-white px-2 py-2" bind:value={globalConfig.mode}>
					<option value="upcoming_events">Upcoming events</option>
					<option value="message">Full-screen message</option>
				</select>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-stone-600">
				<span>Notification position</span>
				<select
					class="rounded-md border border-stone-200 bg-white px-2 py-2"
					bind:value={globalConfig.notificationPosition}
					disabled={!globalConfig.notificationEnabled}
				>
					<option value="top">Top</option>
					<option value="bottom">Bottom</option>
				</select>
			</label>
		</div>
		<label class="mt-3 flex items-center gap-2 text-sm font-medium text-stone-700">
			<input type="checkbox" bind:checked={globalConfig.notificationEnabled} />
			Show notification banner
		</label>
		{#if globalConfig.notificationEnabled}
			<div class="mt-3">
				<Input
					bind:value={globalConfig.notificationMessage}
					class="bg-white"
					placeholder="Banner text (e.g. Lunch starts in 10 minutes)"
				/>
			</div>
		{/if}
		{#if globalConfig.mode === 'message'}
			<div class="mt-3">
				<Textarea
					bind:value={globalConfig.messageBody}
					class="min-h-[8rem] bg-white"
					placeholder="Enter the full-screen message"
				/>
			</div>
		{/if}
		<div class="mt-4 flex items-center gap-2">
			<Button class="h-8" on:click={saveGlobalConfig} disabled={savingGlobal}>
				{savingGlobal ? 'Saving...' : 'Save Global State'}
			</Button>
			<Button variant="outline" class="h-8" on:click={refresh}>Refresh</Button>
		</div>
	</div>

	<div class="mt-6 overflow-hidden rounded-xl border border-stone-200">
		<div class="border-b border-stone-200 bg-stone-100/70 px-4 py-2 text-sm font-semibold text-stone-700">
			Screens
		</div>
		<table class="w-full border-collapse">
			<thead class="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
				<tr>
					<th class="px-3 py-2">ID</th>
					<th class="px-3 py-2">Name</th>
					<th class="px-3 py-2">Status</th>
					<th class="px-3 py-2">Config</th>
					<th class="px-3 py-2">Preview URL</th>
					<th class="px-3 py-2">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if rows.length === 0}
					<tr>
						<td colspan="6" class="px-3 py-6 text-center text-sm text-stone-500">
							No screens yet. Create your first screen.
						</td>
					</tr>
				{:else}
					{#each rows as row}
						<tr class="border-t border-stone-100 align-top text-sm">
							<td class="px-3 py-3 font-semibold text-stone-700">{row.key}</td>
							<td class="px-3 py-3">
								<Input bind:value={row.name} class="bg-white" />
							</td>
							<td class="px-3 py-3">
								<select class="rounded-md border border-stone-200 bg-white px-2 py-2" bind:value={row.status}>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</select>
							</td>
							<td class="px-3 py-3">
								{#if row.hasOverride}
									<div class="mb-2 rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">
										Using override
									</div>
								{:else}
									<div class="mb-2 rounded bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600">
										Using global defaults
									</div>
								{/if}

								{#if row.hasOverride}
									<div class="space-y-2 rounded border border-stone-200 bg-white p-2">
										<select
											class="w-full rounded-md border border-stone-200 bg-white px-2 py-1.5"
											bind:value={row.config.mode}
										>
											<option value="upcoming_events">Upcoming events</option>
											<option value="message">Full-screen message</option>
										</select>
										<label class="flex items-center gap-2 text-xs font-medium text-stone-700">
											<input type="checkbox" bind:checked={row.config.notificationEnabled} />
											Notification banner
										</label>
										{#if row.config.notificationEnabled}
											<Input
												bind:value={row.config.notificationMessage}
												class="bg-white"
												placeholder="Banner text"
											/>
											<select
												class="w-full rounded-md border border-stone-200 bg-white px-2 py-1.5"
												bind:value={row.config.notificationPosition}
											>
												<option value="top">Top</option>
												<option value="bottom">Bottom</option>
											</select>
										{/if}
										{#if row.config.mode === 'message'}
											<Textarea
												bind:value={row.config.messageBody}
												class="min-h-[6rem] bg-white"
												placeholder="Full-screen message"
											/>
										{/if}
										<div class="flex items-center gap-2">
											<Button
												size="sm"
												class="h-7"
												on:click={() => saveOverride(row)}
												disabled={overrideSaving === row.id}
											>
												{overrideSaving === row.id ? 'Saving...' : 'Save Override'}
											</Button>
											<Button
												size="sm"
												variant="outline"
												class="h-7"
												on:click={() => clearOverride(row)}
												disabled={overrideSaving === row.id}
											>
												Clear
											</Button>
										</div>
									</div>
								{:else}
									<Button
										size="sm"
										variant="outline"
										class="h-7"
										on:click={() => {
											row.config = toConfigForm(globalConfig)
											row.hasOverride = true
										}}
									>
										Add Override
									</Button>
								{/if}
							</td>
							<td class="px-3 py-3">
								<a
									class="text-sky-700 underline"
									href={`/screen/${row.key}`}
									target="_blank"
									rel="noreferrer"
								>
									/screen/{row.key}
								</a>
							</td>
							<td class="px-3 py-3">
								<Button
									size="sm"
									class="h-7"
									on:click={() => saveScreenMeta(row)}
									disabled={rowSaving === row.id}
								>
									{rowSaving === row.id ? 'Saving...' : 'Save'}
								</Button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</AdminScreen>
