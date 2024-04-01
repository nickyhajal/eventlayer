<script lang="ts">
import { Plus } from '@steeze-ui/heroicons'
import ElementFormRow from '$lib/components/form/ElementFormRow.svelte'
import FormElements from '$lib/components/form/FormElements.svelte'
import Input from '$lib/components/ui/input/input.svelte'
import { trpc } from '$lib/trpc/client'
import { dndzone } from 'svelte-dnd-action'
import { flip } from 'svelte/animate'
import { writable } from 'svelte/store'

import type { FormWithElements } from '@matterloop/db'
import { HeroIcon, IconPopupMenu } from '@matterloop/ui'
import { debounce, getId, keyBy } from '@matterloop/util'

let formInput: FormWithElements
export { formInput as form }

let form = writable<FormWithElements>(formInput)
let opens: { [key: string]: boolean } = {}
let selectedElement = $form?.elements?.[0] || null
let lastElement = ''
$: selectedIndex = $form.elements?.findIndex((el) => el.id === selectedElement.id)
$: selectedId = selectedElement?.id
$: console.log(selectedElement)
$: {
	if (lastElement !== JSON.stringify(selectedElement)) {
		const index = $form.elements.findIndex((el) => el.id === selectedElement.id)
		$form.elements[index] = selectedElement
		lastElement = JSON.stringify(selectedElement)
	}
}
function saveRaw() {
	// console.log(getChanges())
	// if (formElm && initialForm) {
	// 	formElm.requestSubmit()
	// } else {
	// 	initialForm = data.form
	// }
}
const save = debounce(saveRaw, 1000)
function addElement(index?: number) {
	if (!$form.elements) $form.elements = []
	if (index === undefined) {
		index = $form.elements.length
	}
	$form.elements.splice(index, 0, {
		id: getId(),
		type: 'text',
		label: '',
		formId: $form.id,
	})
	$form.elements = $form.elements
}
function removeElement(index: number) {
	$form.elements.splice(index, 1)
	$form.elements = $form.elements
	handleChangedElements()
}
function handleChangedElements() {
	const orderChanges: { id: string; ord: number }[] = []
	$form.elements.map((elm, i) => {
		if (elm.ord !== i) {
			orderChanges.push({ id: elm.id, ord: i })
			$form.elements[i].ord = i
		}
	})
	if (orderChanges.length && $form?.id) {
		trpc().formElement.order.mutate({ id: $form.id, changes: orderChanges })
	}
}
const flipDurationMs = 300
function handleDndConsider(e) {
	$form.elements = e.detail.items
}
function handleDndFinalize(e) {
	$form.elements = e.detail.items
	handleChangedElements()
}
</script>

<div class="-ml-10 -mr-10 -mt-9 grid h-full grid-rows-[5rem_1fr]">
	<div class="flex items-center border-b border-stone-100">
		<Input
			name="name"
			placeholder="Name"
			bind:value={$form.name}
			class="ml-4 border-0 p-0 pl-2 text-xl font-semibold text-slate-800 shadow-none transition-all focus-within:ring-slate-300  hover:bg-blue-50/40 hover:ring-slate-300 focus:ring-slate-300 focus-visible:ring-slate-300 active:ring-slate-300"
		/>
	</div>
	<div class="grid h-full grid-cols-[18rem_1fr_18rem]">
		<div
			class="flex h-full flex-col gap-1 bg-stone-50/80 px-2 pb-2 pt-2"
			use:dndzone={{
			items: $form.elements,
			flipDurationMs,
			dropTargetStyle: {},
			dropTargetClasses: ['outline-blue-200', 'outline-dashed', 'outline-2'],
		}}
			on:consider={handleDndConsider}
			on:finalize={handleDndFinalize}
		>
			{#if $form.elements}
				{#each $form?.elements || [] as element, i (element.id)}
					<div class="w-full">
						<!-- animate:flip={{ durtion: flipDurationMs }} -->
						<button
							on:click={() => selectedElement = element}
							class="mb-1 flex w-full flex-col rounded-lg px-2 pb-2 pr-8 pt-1 text-left text-[0.85rem] font-medium text-stone-600 {selectedElement.id === element.id ? 'bg-stone-200/50' : 'bg-transparent'}"
						>
							<div class="mt-[1px] line-clamp-2">{element.label}</div>
							<div
								class=" h-fit rounded-md bg-stone-200/70 px-1 py-[1px] text-[0.8rem] text-stone-700/70"
							>
								{element.type}
							</div>
						</button>
						<div class="h-0.5 w-full border-b border-slate-400/20"></div>
					</div>
				{/each}
			{/if}
			{#if !$form.elements.length}
				<div class="rounded-xl px-2 pb-2 pt-8 text-center">
					<div class="mb-8 text-sm font-medium text-slate-500">Start Designing Your Report</div>
					<button
						on:click={() => addElement()}
						class="mt-3 block w-full rounded-lg border border-stone-100 bg-white px-2.5 py-2 text-[0.9rem] font-medium text-emerald-600/90 transition-all hover:border-emerald-500/20"
					>
						Add First Element
					</button>
				</div>
			{:else}
				<button
					on:click={() => addElement()}
					class="mt-3 block w-full rounded-lg border border-stone-100 bg-white px-2.5 py-3 text-[0.9rem] font-medium text-emerald-600/90 transition-all hover:border-emerald-500/20"
				>
					Add an Element
				</button>
			{/if}
		</div>
		<div class="flex flex-col gap-4 px-1 py-4">
			{#if $form.elements.length}
				<div class="mx-auto max-w-xl">
					<FormElements
						elements={$form.elements}
						selectedId={selectedElement.id}
						rowClass="rounded-lg px-6 py-3"
						handleRowClick={(el) => selectedElement = el}
					/>
				</div>
			{/if}
		</div>
		{#if $form.elements.length}
			{#key selectedElement.id}
				<div class="flex h-full flex-col gap-1 bg-stone-50/80 px-2 pb-2 pt-2">
					<div class="relative flex-grow">
						<div class="">
							<ElementFormRow
								bind:element={selectedElement}
								index={selectedIndex}
								on:delete={() => removeElement(selectedIndex)}
								on:elementChange={() => handleChangedElements()}
							/>
						</div>
					</div>
					<div class="flex items-end justify-start">
						<button
							on:click={() => addElement(i + 1)}
							class="block w-fit rounded-md bg-slate-50 text-[0.85rem] font-medium text-slate-400/80 opacity-100 transition-all hover:bg-slate-200/80 hover:text-emerald-600/70 group-hover:opacity-100"
							><HeroIcon src={Plus} class="w-5 text-slate-400" /></button
						>
					</div>
				</div>
			{/key}
		{/if}
	</div>
</div>
