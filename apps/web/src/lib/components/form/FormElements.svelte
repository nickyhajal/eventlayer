<script lang="ts">
import Element from '$lib/components/form/Element.svelte'
import { createEventDispatcher, type SvelteComponent } from 'svelte'

import { FormRow, tw } from '@matterloop/ui'

interface Option {
	label: string
	value: string
}
interface FormElement {
	formId: string
	type: string
	content: string
	label: string
	placeholder: string
	ord: number
	page: number
	step: number
	group: number
	options: Option[]
	key?: string
}
export let elements: FormElement[]
export let rowClass = ''
export let values = {}
export let includedComponents: { [key: string]: SvelteComponent } = {}
export let handleRowClick: false | ((e: FormElement) => void) = false
export let selectedId: string

function getVisibleElements(elements) {
	return elements.filter(({ hide }) => !hide || !hide(values))
}
</script>

{#each elements as el}
	<div
		class="{selectedId === el.id ? 'bg-yellow-50' : ''} {rowClass}"
		on:click={() => handleRowClick && handleRowClick(el)}
		role="button"
		tabindex="-1"
	>
		{#if el.length}
			<div class={el[0].rowClass}>
				{#if el[0].rowLabel}
					<div
						class={tw(`ml-0.5 pb-1 text-sm font-medium text-slate-600`, el[0].rowLabelClass || '')}
					>
						{el[0].rowLabel}
					</div>
				{/if}
				<FormRow>
					{#each getVisibleElements(el) as props}
						<Element props={props} bind:values={values} includedComponents={includedComponents} />
					{/each}
				</FormRow>
			</div>
		{:else}
			<Element props={el} bind:values={values} includedComponents={includedComponents} />
		{/if}
	</div>
{/each}
