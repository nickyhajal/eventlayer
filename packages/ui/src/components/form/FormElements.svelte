<script lang="ts">
	import { SvelteComponent, createEventDispatcher } from 'svelte'
	import FormRow from './FormRow.svelte'
	import IconButton from './IconButton.svelte'
	import Element from './Element.svelte'
	import { tw } from 'src/lib/tw'

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
	const dispatch = createEventDispatcher()
	let bindcatch

	function getVisibleElements(elements) {
		return elements.filter(({ hide }) => !hide || !hide(values))
	}
</script>

{#each elements as el}
	{#if el.length}
		<FormRow class={el[0].rowClass}>
			{#each getVisibleElements(el) as props}
				{el.type}
				<Element {props} bind:values {includedComponents} />
			{/each}
		</FormRow>
	{:else}
		{el.type}
		<Element props={el} bind:values {includedComponents} />
	{/if}
{/each}

<style lang="postcss">
	p.explanation {
		font-size: 1.12rem;
		font-weight: 500;
		margin-top: -1.2rem;
		margin-bottom: 1.4rem;
	}
</style>
