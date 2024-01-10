<script lang="ts">
	// import InfoPane from './InfoPane.svelte'
	import { SvelteComponent, createEventDispatcher } from 'svelte'
	import FormRow from './FormRow.svelte'
	import Input from './Input.svelte'
	import IconButton from './IconButton.svelte'
	import Element from './Element.svelte'
	import { tw } from 'src/lib/tw'
	import Button from './Button.svelte'
	import { page } from '$app/stores'

	export let fields
	export let values = {}
	export let includedComponents: { [key: string]: SvelteComponent } = {}
	const dispatch = createEventDispatcher()
	let bindcatch
	$: community = $page.data.community

	function getVisibleFields(fields) {
		return fields.filter(({ hide }) => !hide || !hide(values))
	}
</script>

{#each fields as field}
	{#if field.title}
		<div class="titleShell">
			<div class="pb-2 pt-8 text-lg font-semibold">
				<h4 class={tw(`mb-2 ${field.classes} ${field.class}`)}>
					{field.title}
				</h4>
			</div>
			{#if field.info}
				<!-- <InfoPane {...field.info} /> -->
			{/if}
			{#if field.button}
				<IconButton icon="add" on:click={() => dispatch(field.button.handleClick)}>
					{field.button.message}
				</IconButton>
			{/if}
		</div>
		{#if field.explanation}
			<p class="explanation">{field.explanation}</p>
		{/if}
	{:else if field.length}
		<FormRow class={field[0].rowClass}
			>{#each getVisibleFields(field) as props}
				<Element {props} bind:values {community} {includedComponents} />
			{/each}</FormRow
		>
	{:else}
		<Element props={field} bind:values {community} {includedComponents} />
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
