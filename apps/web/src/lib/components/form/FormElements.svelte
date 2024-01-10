<script lang="ts">
import { FormRow, tw } from '@matterloop/ui'
import Element from '$lib/components/form/Element.svelte'
import type { SvelteComponent } from 'svelte'

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
export let values = {}
export let includedComponents: { [key: string]: SvelteComponent } = {}

function getVisibleElements(elements) {
	return elements.filter(({ hide }) => !hide || !hide(values))
}
</script>

{#each elements as el}
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
{/each}
