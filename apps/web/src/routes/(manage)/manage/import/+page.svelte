<script lang="ts">
	import { onMount } from 'svelte'
	import AdminScreen from '../AdminScreen.svelte'
	import { Button } from '$lib/components/ui/button'
	import * as Checkbox from '$lib/components/ui/checkbox'
	import * as Dialog from '$lib/components/ui/dialog'
	import Input from '$lib/components/ui/input/input.svelte'
	import Label from '$lib/components/ui/label/label.svelte'
	import * as Select from '$lib/components/ui/select'
	import { Textarea } from '$lib/components/ui/textarea'
	import { trpc } from '$lib/trpc/client'
	import Upload from 'lucide-svelte/icons/upload'
	import { toast } from 'svelte-sonner'

	import {
		buildPreviewRows,
		getTypeSourceValues,
		normalizeHeader,
		normalizeTypeValue,
		parseTabularText,
		suggestInfoKey,
		suggestRequiredMappings,
		type ColumnMapping,
		type ExtraColumnConfig,
		type ImportRowPayload,
		type ImportRunSummary,
		type NameSplitConfig,
		type ParsedTable,
		type PreviewRow,
		type TypeSourceValue,
	} from './importUtils'

	const IMPORT_PRESETS_STORAGE_KEY = 'manage_import_users_presets_v1'
	const TYPE_DEFAULT_SELECT_VALUE = '__default_type__'

	interface StoredExtraColumnPreset {
		include: boolean
		key: string
	}

	interface StoredImportPresets {
		version: number
		mapping?: Partial<ColumnMapping>
		splitNameEnabled?: boolean
		nameSourceHeader?: string | null
		defaultType?: string
		extraByHeader?: Record<string, StoredExtraColumnPreset>
		typeValueMapByHeader?: Record<string, Record<string, string>>
	}

	let parsedTable: ParsedTable | null = null
	let mapping: ColumnMapping = {
		firstName: null,
		lastName: null,
		email: null,
		type: null,
	}
	let extraColumns: ExtraColumnConfig[] = []
	let previewRows: PreviewRow[] = []
	let existingKeys: string[] = []
	let existingEventEmails = new Set<string>()
	let importSummary: ImportRunSummary | null = null

	let mappingDialogOpen = false
	let splitNameEnabled = false
	let nameSourceHeader: string | null = null
	let defaultType = 'attendee'
	let typeValueMap: Record<string, string> = {}
	let typeSourceValues: TypeSourceValue[] = []
	let rawInput = ''
	let selectedFileName = ''
	let loadingParse = false
	let importing = false
	let dragActive = false
	let fileInput: HTMLInputElement | null = null
	let progress = {
		completedBatches: 0,
		totalBatches: 0,
		importedRows: 0,
		totalRows: 0,
	}
	let presetsLoaded = false
	let presetMapping: ColumnMapping = {
		firstName: null,
		lastName: null,
		email: null,
		type: null,
	}
	let presetSplitNameEnabled = false
	let presetNameSourceHeader: string | null = null
	let presetDefaultType = 'attendee'
	let storedExtraByHeader: Record<string, StoredExtraColumnPreset> = {}
	let storedTypeValueMapByHeader: Record<string, Record<string, string>> = {}

	$: selectedRequiredHeaders = new Set(
		[
			mapping.email,
			splitNameEnabled ? nameSourceHeader : mapping.firstName,
			splitNameEnabled ? null : mapping.lastName,
			mapping.type,
		].filter(Boolean),
	)
	$: activeExtraColumns = extraColumns.filter((column) => !selectedRequiredHeaders.has(column.sourceHeader))
	$: previewKeys = Array.from(
		new Set(
			activeExtraColumns
				.filter((column) => column.include && column.key.trim())
				.map((column) => column.key.trim()),
		),
	)
	$: validPreviewRows = previewRows.filter((row) => row.valid)
	$: invalidPreviewRows = previewRows.length - validPreviewRows.length
	$: alreadyAttendingRows = previewRows.filter((row) => row.valid && row.alreadyAttending).length
	$: typeSourceValues = parsedTable ? getTypeSourceValues(parsedTable, mapping.type) : []

	function resetImportState() {
		previewRows = []
		importSummary = null
		progress = {
			completedBatches: 0,
			totalBatches: 0,
			importedRows: 0,
			totalRows: 0,
		}
	}

	function headerExists(headers: string[], header: string | null | undefined): header is string {
		if (!header) return false
		return headers.includes(header)
	}

	function sanitizeColumnMapping(partial?: Partial<ColumnMapping>): ColumnMapping {
		return {
			firstName: partial?.firstName ?? null,
			lastName: partial?.lastName ?? null,
			email: partial?.email ?? null,
			type: partial?.type ?? null,
		}
	}

	function loadImportPresets() {
		if (typeof window === 'undefined') return

		try {
			const raw = window.localStorage.getItem(IMPORT_PRESETS_STORAGE_KEY)
			if (!raw) {
				presetsLoaded = true
				return
			}

			const parsed = JSON.parse(raw) as StoredImportPresets
			presetMapping = sanitizeColumnMapping(parsed.mapping)
			presetSplitNameEnabled = Boolean(parsed.splitNameEnabled)
			presetNameSourceHeader = parsed.nameSourceHeader ?? null
			presetDefaultType = normalizeTypeValue(parsed.defaultType || 'attendee') || 'attendee'
			storedExtraByHeader = parsed.extraByHeader || {}
			storedTypeValueMapByHeader = parsed.typeValueMapByHeader || {}
		} catch (err) {
			presetMapping = sanitizeColumnMapping()
			presetSplitNameEnabled = false
			presetNameSourceHeader = null
			presetDefaultType = 'attendee'
			storedExtraByHeader = {}
			storedTypeValueMapByHeader = {}
		} finally {
			presetsLoaded = true
		}
	}

	function persistImportPresets() {
		if (!presetsLoaded || typeof window === 'undefined') return

		const mergedExtraByHeader = {
			...storedExtraByHeader,
		}
		extraColumns.forEach((column) => {
			mergedExtraByHeader[normalizeHeader(column.sourceHeader)] = {
				include: column.include,
				key: column.key.trim(),
			}
		})

		const mergedTypeValueMapByHeader = {
			...storedTypeValueMapByHeader,
		}
		if (mapping.type && Object.keys(typeValueMap).length) {
			mergedTypeValueMapByHeader[normalizeHeader(mapping.type)] = {
				...typeValueMap,
			}
		}

		const payload: StoredImportPresets = {
			version: 1,
			mapping,
			splitNameEnabled,
			nameSourceHeader,
			defaultType,
			extraByHeader: mergedExtraByHeader,
			typeValueMapByHeader: mergedTypeValueMapByHeader,
		}

		window.localStorage.setItem(IMPORT_PRESETS_STORAGE_KEY, JSON.stringify(payload))
		presetMapping = sanitizeColumnMapping(mapping)
		presetSplitNameEnabled = splitNameEnabled
		presetNameSourceHeader = nameSourceHeader
		presetDefaultType = defaultType
		storedExtraByHeader = mergedExtraByHeader
		storedTypeValueMapByHeader = mergedTypeValueMapByHeader
	}

	function setMappingField(field: keyof ColumnMapping, value: string | null) {
		mapping = {
			...mapping,
			[field]: value,
		}
		if (field === 'type') {
			syncTypeValueMapForCurrentType()
		}
		persistImportPresets()
	}

	function setSplitName(value: boolean) {
		splitNameEnabled = value
		persistImportPresets()
	}

	function setNameSource(value: string | null) {
		nameSourceHeader = value
		persistImportPresets()
	}

	function setDefaultType(value: string) {
		defaultType = normalizeTypeValue(value) || 'attendee'
		persistImportPresets()
	}

	function syncTypeValueMapForCurrentType() {
		if (!parsedTable || !mapping.type) {
			typeValueMap = {}
			return
		}

		const storedKey = normalizeHeader(mapping.type)
		const savedMap = storedTypeValueMapByHeader[storedKey] || {}
		const sourceValues = getTypeSourceValues(parsedTable, mapping.type)
		const nextMap: Record<string, string> = {}

		sourceValues.forEach((value) => {
			const current = typeValueMap[value.normalizedValue]
			const fromSaved = savedMap[value.normalizedValue]
			const fallback = value.normalizedValue
			nextMap[value.normalizedValue] =
				normalizeTypeValue(current || fromSaved || fallback) || defaultType
		})

		typeValueMap = nextMap
	}

	function setTypeValueMapping(normalizedSource: string, mappedTo: string) {
		typeValueMap = {
			...typeValueMap,
			[normalizedSource]: normalizeTypeValue(mappedTo) || defaultType,
		}
		persistImportPresets()
	}

	onMount(() => {
		loadImportPresets()
	})

	function suggestNameHeader(headers: string[]): string | null {
		const candidates = ['name', 'full_name', 'full name', 'attendee name']
		const byHeader = new Map(headers.map((header) => [header.toLowerCase().trim(), header] as const))
		for (const candidate of candidates) {
			const match = byHeader.get(candidate)
			if (match) return match
		}
		const loose = headers.find((header) => {
			const h = header.toLowerCase()
			return h.includes('full') && h.includes('name')
		})
		return loose || null
	}

	async function loadExistingKeys() {
		try {
			const res = await trpc().import.getKeySuggestions.query()
			existingKeys = res.existingKeys || []
			existingEventEmails = new Set(
				(res.existingEmails || [])
					.map((email) => `${email}`.trim().toLowerCase())
					.filter(Boolean),
			)
		} catch (err) {
			existingKeys = []
			existingEventEmails = new Set()
		}
	}

	function buildInitialExtraColumns(headers: string[], required: ColumnMapping) {
		extraColumns = headers.map((header) => {
			const suggestedKey = suggestInfoKey(header, existingKeys)
			const preset = storedExtraByHeader[normalizeHeader(header)]
			return {
				sourceHeader: header,
				include: preset?.include ?? true,
				key: preset?.key?.trim() || suggestedKey,
				suggestedKey,
			}
		})

		const requiredHeaders = new Set(
			[required.firstName, required.lastName, required.email, required.type].filter(Boolean),
		)
		extraColumns = extraColumns.map((column) =>
			requiredHeaders.has(column.sourceHeader) ? { ...column, include: false } : column,
		)
	}

	async function parseSourceText(text: string, label: string) {
		if (!text.trim()) {
			toast.error('No data provided')
			return
		}
		if (!presetsLoaded) {
			loadImportPresets()
		}

		loadingParse = true
		try {
			const parsed = parseTabularText(text)
			parsedTable = parsed
			selectedFileName = label
			resetImportState()

			await loadExistingKeys()
			const suggestedMapping = suggestRequiredMappings(parsed.headers)
			mapping = {
				firstName: headerExists(parsed.headers, presetMapping.firstName)
					? presetMapping.firstName
					: suggestedMapping.firstName,
				lastName: headerExists(parsed.headers, presetMapping.lastName)
					? presetMapping.lastName
					: suggestedMapping.lastName,
				email: headerExists(parsed.headers, presetMapping.email)
					? presetMapping.email
					: suggestedMapping.email,
				type: headerExists(parsed.headers, presetMapping.type)
					? presetMapping.type
					: suggestedMapping.type,
			}
			defaultType = presetDefaultType
			splitNameEnabled = presetSplitNameEnabled
			nameSourceHeader = headerExists(parsed.headers, presetNameSourceHeader)
				? presetNameSourceHeader
				: suggestNameHeader(parsed.headers)
			if (splitNameEnabled && !nameSourceHeader) {
				splitNameEnabled = false
			}
			buildInitialExtraColumns(parsed.headers, mapping)
			typeValueMap = {}
			syncTypeValueMapForCurrentType()
			persistImportPresets()
			mappingDialogOpen = true
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Unable to parse input')
		} finally {
			loadingParse = false
		}
	}

	async function handleFile(file: File) {
		const ext = file.name.split('.').pop()?.toLowerCase()
		if (!ext) {
			toast.error('Unsupported file type')
			return
		}
		if (ext === 'xls' || ext === 'xlsx') {
			toast.error('XLS parsing is not enabled yet. Export to CSV or paste table data.')
			return
		}
		if (ext !== 'csv') {
			toast.error('Only CSV file import is available right now')
			return
		}

		const text = await file.text()
		await parseSourceText(text, file.name)
	}

	async function onFileInputChange(event: Event) {
		const target = event.currentTarget as HTMLInputElement
		const file = target.files?.[0]
		if (file) {
			await handleFile(file)
		}
		target.value = ''
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault()
		dragActive = true
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault()
		dragActive = false
	}

	async function onDrop(event: DragEvent) {
		event.preventDefault()
		dragActive = false
		const file = event.dataTransfer?.files?.[0]
		if (file) {
			await handleFile(file)
		}
	}

	function setExtraInclude(sourceHeader: string, include: boolean) {
		extraColumns = extraColumns.map((column) =>
			column.sourceHeader === sourceHeader ? { ...column, include } : column,
		)
		persistImportPresets()
	}

	function setExtraKey(sourceHeader: string, key: string) {
		extraColumns = extraColumns.map((column) =>
			column.sourceHeader === sourceHeader ? { ...column, key } : column,
		)
		persistImportPresets()
	}

	function buildPreview() {
		if (!parsedTable) return

		const nameSplit: NameSplitConfig = {
			enabled: splitNameEnabled,
			nameHeader: nameSourceHeader,
		}
		if (splitNameEnabled) {
			const requiredValues = [mapping.email, nameSourceHeader]
			if (requiredValues.some((value) => !value)) {
				toast.error('Map email and name column before continuing')
				return
			}
			const selectedValues = [...requiredValues, mapping.type].filter(Boolean)
			const uniqueValues = new Set(selectedValues)
			if (uniqueValues.size !== selectedValues.length) {
				toast.error('Each required field must map to a different column')
				return
			}
		} else {
			const requiredValues = [mapping.firstName, mapping.lastName, mapping.email]
			if (requiredValues.some((value) => !value)) {
				toast.error('Map first name, last name, and email before continuing')
				return
			}
			const selectedValues = [...requiredValues, mapping.type].filter(Boolean)
			const uniqueValues = new Set(selectedValues)
			if (uniqueValues.size !== selectedValues.length) {
				toast.error('Each required field must map to a different column')
				return
			}
		}

		const preview = buildPreviewRows(parsedTable, mapping, activeExtraColumns, nameSplit, {
			sourceHeader: mapping.type,
			defaultType,
			valueMap: typeValueMap,
		}, existingEventEmails)
		previewRows = preview
		mappingDialogOpen = false
		persistImportPresets()

		if (!preview.length) {
			toast.error('No rows found to preview')
			return
		}
		toast.success(`Preview ready: ${preview.filter((row) => row.valid).length} valid rows`)
	}

	function chunkRows<T>(rows: T[], size: number): T[][] {
		const chunks: T[][] = []
		for (let i = 0; i < rows.length; i += size) {
			chunks.push(rows.slice(i, i + size))
		}
		return chunks
	}

	async function runImport() {
		if (importing) return
		if (!previewRows.length) {
			toast.error('Build a preview first')
			return
		}
		if (!validPreviewRows.length) {
			toast.error('No valid rows to import')
			return
		}

		const importId =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2)}`

		const payloadRows: ImportRowPayload[] = validPreviewRows.map((row) => ({
			rowNumber: row.rowNumber,
			email: row.email,
			firstName: row.firstName || undefined,
			lastName: row.lastName || undefined,
			type: row.type || defaultType,
			info: Object.keys(row.info).length ? row.info : undefined,
		}))

		const chunks = chunkRows(payloadRows, 25)
		const summary: ImportRunSummary = {
			importId,
			processed: 0,
			created: 0,
			updated: 0,
			skipped: invalidPreviewRows,
		}

		importing = true
		progress = {
			completedBatches: 0,
			totalBatches: chunks.length,
			importedRows: 0,
			totalRows: payloadRows.length,
		}
		try {
			for (let index = 0; index < chunks.length; index += 1) {
				const chunk = chunks[index]
				const res = await trpc().import.importUsers.mutate({
					importId,
					rows: chunk,
				})
				summary.processed += res.totals.processed
				summary.created += res.totals.created
				summary.updated += res.totals.updated
				summary.skipped += res.totals.skipped

				progress = {
					...progress,
					completedBatches: index + 1,
					importedRows: progress.importedRows + chunk.length,
				}
			}

			importSummary = summary
			toast.success('Import completed')
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Import failed')
		} finally {
			importing = false
		}
	}
</script>

<AdminScreen title="Import Attendees">
	<div class="max-w-6xl space-y-6">
		<div class="rounded-lg border border-stone-200 bg-white p-5">
			<div class="mb-3 text-base font-semibold text-stone-800">1. Source</div>
			<div
				class="rounded-lg border border-dashed p-6 text-center {dragActive
					? 'border-emerald-500 bg-emerald-50/40'
					: 'border-stone-300 bg-stone-50/40'}"
				role="region"
				aria-label="User import file dropzone"
				on:dragover={onDragOver}
				on:dragleave={onDragLeave}
				on:drop={onDrop}
			>
				<div class="mb-2 flex items-center justify-center">
					<Upload class="h-5 w-5 text-stone-500" />
				</div>
				<div class="mb-2 text-sm font-medium text-stone-700">
					Drop CSV file here, or choose a file
				</div>
				<div class="mb-4 text-xs text-stone-500">CSV files only for direct upload (XLS/XLSX via paste)</div>
				<input
					type="file"
					accept=".csv,.xls,.xlsx"
					class="hidden"
					bind:this={fileInput}
					on:change={onFileInputChange}
				/>
				<Button variant="outline" on:click={() => fileInput?.click()} disabled={loadingParse}>
					Choose File
				</Button>
				{#if selectedFileName}
					<div class="mt-3 text-xs text-stone-500">Loaded: {selectedFileName}</div>
				{/if}
			</div>

			<div class="mt-5">
				<Label for="paste-input" class="mb-2 block">Paste CSV/Excel Table Data</Label>
				<Textarea
					id="paste-input"
					rows={8}
					bind:value={rawInput}
					placeholder="Paste rows from CSV/Excel here..."
				/>
				<div class="mt-3 flex justify-end">
					<Button
						variant="outline"
						disabled={loadingParse || !rawInput.trim()}
						on:click={() => parseSourceText(rawInput, 'Pasted data')}
					>
						Parse Pasted Data
					</Button>
				</div>
			</div>
		</div>

		{#if previewRows.length}
			<div class="rounded-lg border border-stone-200 bg-white p-5">
				<div class="mb-3 text-base font-semibold text-stone-800">2. Preview</div>
				<div class="mb-3 text-sm text-stone-600">
					{validPreviewRows.length} valid row(s), {invalidPreviewRows} skipped row(s)
					{#if alreadyAttendingRows}
						• {alreadyAttendingRows} already attending
					{/if}
				</div>
				<div class="max-h-[28rem] overflow-auto rounded-md border border-stone-200">
					<table class="w-full min-w-[42rem] text-left text-sm">
						<thead class="sticky top-0 bg-stone-100 text-xs uppercase text-stone-600">
								<tr>
									<th class="px-3 py-2">Row</th>
									<th class="px-3 py-2">First</th>
									<th class="px-3 py-2">Last</th>
									<th class="px-3 py-2">Email</th>
									<th class="px-3 py-2">Type</th>
									{#each previewKeys as key}
										<th class="px-3 py-2">{key}</th>
									{/each}
									<th class="px-3 py-2">Status</th>
							</tr>
						</thead>
							<tbody>
								{#each previewRows as row}
									<tr class={row.valid && !row.alreadyAttending ? 'bg-white' : 'bg-red-50/60'}>
									<td class="border-t border-stone-200 px-3 py-2 text-xs text-stone-600">
										{row.rowNumber}
									</td>
										<td class="border-t border-stone-200 px-3 py-2">{row.firstName}</td>
										<td class="border-t border-stone-200 px-3 py-2">{row.lastName}</td>
										<td class="border-t border-stone-200 px-3 py-2">{row.email}</td>
										<td class="border-t border-stone-200 px-3 py-2">{row.type}</td>
										{#each previewKeys as key}
											<td class="border-t border-stone-200 px-3 py-2">{row.info[key] || ''}</td>
										{/each}
									<td class="border-t border-stone-200 px-3 py-2 text-xs">
										{#if !row.valid}
											<span class="font-semibold text-red-700">{row.errors.join(', ')}</span>
										{:else if row.alreadyAttending}
											<span class="font-semibold text-red-700">Already attending (will update)</span>
										{:else}
											<span class="font-semibold text-emerald-700">Ready</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="mt-4 flex flex-wrap items-center gap-3">
					<Button variant="outline" on:click={() => (mappingDialogOpen = true)}>Edit Mapping</Button>
					<Button disabled={importing || !validPreviewRows.length} on:click={runImport}>
						{importing ? 'Importing...' : `Import ${validPreviewRows.length} Row(s)`}
					</Button>
				</div>

				{#if importing}
					<div class="mt-3 text-xs text-stone-600">
						Batch {progress.completedBatches}/{progress.totalBatches} • Imported {progress.importedRows}/{progress.totalRows}
					</div>
				{/if}
			</div>
		{/if}

		{#if importSummary}
			<div class="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
				<div class="mb-2 text-base font-semibold text-emerald-800">Import Complete</div>
				<div class="text-sm text-emerald-800">Import ID: <span class="font-mono">{importSummary.importId}</span></div>
				<div class="mt-2 text-sm text-emerald-800">
					Processed: {importSummary.processed} • Created: {importSummary.created} • Updated: {importSummary.updated} • Skipped: {importSummary.skipped}
				</div>
			</div>
		{/if}
	</div>
</AdminScreen>

<Dialog.Root bind:open={mappingDialogOpen}>
	<Dialog.Content class="sm:max-w-[760px]">
		<Dialog.Header>
			<Dialog.Title>Confirm Column Mapping</Dialog.Title>
			<Dialog.Description>Map required fields and choose extra columns to save as user info.</Dialog.Description>
		</Dialog.Header>

		{#if parsedTable}
			<div class="space-y-5 py-3">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div class="space-y-2">
						<Label>Email</Label>
						<Select.Root
							selected={mapping.email ? { value: mapping.email, label: mapping.email } : undefined}
							onSelectedChange={(v) => setMappingField('email', v?.value || null)}
						>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Select column" />
							</Select.Trigger>
							<Select.Content>
								{#each parsedTable.headers as header}
									<Select.Item value={header} label={header}>{header}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					{#if splitNameEnabled}
						<div class="space-y-2">
							<Label>Name Column</Label>
							<Select.Root
								selected={nameSourceHeader
									? { value: nameSourceHeader, label: nameSourceHeader }
									: undefined}
								onSelectedChange={(v) => setNameSource(v?.value || null)}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="Select name column" />
								</Select.Trigger>
								<Select.Content>
									{#each parsedTable.headers as header}
										<Select.Item value={header} label={header}>{header}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{:else}
						<div class="space-y-2">
							<Label>First Name</Label>
							<Select.Root
								selected={mapping.firstName
									? { value: mapping.firstName, label: mapping.firstName }
									: undefined}
								onSelectedChange={(v) => setMappingField('firstName', v?.value || null)}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="Select column" />
								</Select.Trigger>
								<Select.Content>
									{#each parsedTable.headers as header}
										<Select.Item value={header} label={header}>{header}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="space-y-2">
							<Label>Last Name</Label>
							<Select.Root
								selected={mapping.lastName
									? { value: mapping.lastName, label: mapping.lastName }
									: undefined}
								onSelectedChange={(v) => setMappingField('lastName', v?.value || null)}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="Select column" />
								</Select.Trigger>
								<Select.Content>
									{#each parsedTable.headers as header}
										<Select.Item value={header} label={header}>{header}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					{/if}
					<div class="space-y-2">
						<Label>Type Column</Label>
						<Select.Root
							selected={mapping.type
								? { value: mapping.type, label: mapping.type }
								: { value: TYPE_DEFAULT_SELECT_VALUE, label: 'Default (attendee)' }}
							onSelectedChange={(v) =>
								setMappingField(
									'type',
									v?.value === TYPE_DEFAULT_SELECT_VALUE ? null : (v?.value ?? null),
								)}
						>
							<Select.Trigger class="w-full">
								<Select.Value placeholder="Default (attendee)" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value={TYPE_DEFAULT_SELECT_VALUE} label="Default (attendee)">
									Default (attendee)
								</Select.Item>
								{#each parsedTable.headers as header}
									<Select.Item value={header} label={header}>{header}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<div class="space-y-2">
						<Label>Default Type</Label>
						<Input
							value={defaultType}
							placeholder="attendee"
							on:input={(event) => setDefaultType(event.currentTarget.value)}
						/>
					</div>
				</div>
				<div class="flex items-start gap-2 rounded-md border border-stone-200 bg-stone-50 p-3">
					<Checkbox.Root
						checked={splitNameEnabled}
						on:click={() => setSplitName(!splitNameEnabled)}
					/>
					<div>
						<div class="text-sm font-medium text-stone-700">
							Split a single name field into first and last
						</div>
						<div class="text-xs text-stone-500">
							Uses first space split. Example: "John Van Der Hoot" -> "John" + "Van Der Hoot"
						</div>
					</div>
				</div>

				{#if mapping.type && typeSourceValues.length}
					<div>
						<div class="mb-2 text-sm font-semibold text-stone-700">Type Value Mapping</div>
						<div class="rounded-md border border-stone-200 bg-stone-50 p-3">
							<div class="mb-3 text-xs text-stone-500">
								Source values are slugified automatically. Edit mapped values if needed.
							</div>
							<div class="max-h-[220px] space-y-2 overflow-auto">
								{#each typeSourceValues as source}
									<div class="grid grid-cols-[1fr_1fr] items-center gap-3">
										<div class="text-sm text-stone-700">{source.sourceValue}</div>
										<Input
											value={typeValueMap[source.normalizedValue] || source.normalizedValue}
											on:input={(event) =>
												setTypeValueMapping(
													source.normalizedValue,
													event.currentTarget.value,
												)}
										/>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<div>
					<div class="mb-2 text-sm font-semibold text-stone-700">Extra Columns</div>
					<div class="max-h-[280px] space-y-2 overflow-auto rounded-md border border-stone-200 p-3">
						{#each activeExtraColumns as column}
							<div class="grid grid-cols-[1.2rem_1fr_1fr] items-center gap-3">
								<div class="pt-0.5">
									<Checkbox.Root
										checked={column.include}
										on:click={() => setExtraInclude(column.sourceHeader, !column.include)}
									/>
								</div>
								<div class="text-sm text-stone-700">{column.sourceHeader}</div>
								<Input
									value={column.key}
									placeholder={column.suggestedKey}
									on:input={(event) =>
										setExtraKey(column.sourceHeader, event.currentTarget.value)}
								/>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<Dialog.Footer>
			<Button variant="outline" on:click={() => (mappingDialogOpen = false)}>Cancel</Button>
			<Button on:click={buildPreview}>Continue to Preview</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
