<script lang="ts">
	import { createEventDispatcher, onMount, type ComponentProps } from 'svelte'
	import Switch from './Switch.svelte'
	import Select from './Select.svelte'
	import type { Action } from 'svelte/action'
	import { tw } from '@matterloop/util'
	let className = ''

	interface Options {
		label: string
		value: string
	}

	export { className as class }
	export let value: string | number | null | undefined | string[] = ''
	export let type = 'text'
	export let hint = ''
	export let name = ''
	export let filterText = ''
	export let handleFocus = () => {}
	export let handleBlur = () => {}
	export let step: number | undefined = undefined
	export let min: string | undefined = undefined
	export let max: string | undefined = undefined
	export let required = false
	export let placeholder = ''
	export let autofocus = false
	export let format = ''
	export let disabled = false
	export let readonly = false
	export let multi = false
	export let errors: { [key: string]: string[] } = {}
	export let options: Options[] = []
	export let containerStyles = ''
	export let wrapStyle = ''
	export let extra = {}
	export let maxlength: number | undefined = undefined
	export let showMaxLength = true
	export let style = ''
	export let sample = ''
	export let columns = {}
	export let empty = {}
	export let selectProps: Partial<ComponentProps<Select>> = {}
	export let reload

	const dispatch = createEventDispatcher()
	let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
	let mounted = false
	let focused = false
	$: hasErrors = errors[name]?.length
	const coerceInput = (val: string) => (type.match(/^(number|range)$/) ? +val : val)
	const handleInput = (e: InputEvent) => {
		dispatch('input')
		value = coerceInput((e?.target as HTMLInputElement)?.value)
	}
	$: inputClass = `rounded-xl border focus:border-emerald/30 disabled:bg-gray-100 read-only:bg-gray-100 read-only:cursor-not-allowed disabled:cursor-not-allowed text-slate-600 ${
		hasErrors ? 'border-red-500/40 bg-red-50' : 'border-slate-200 bg-white'
	}`
	onMount(() => {
		// if (input) {
		// 	if (input.value && input.value.length > 0) {
		// 		value = coerceInput(input.value)
		// 	}
		// }
		setTimeout(() => {
			mounted = true
		}, 20)
	})
	const typeAction: Action<HTMLInputElement> = (node) => {
		node.type = type
	}
</script>

<span class={`${className} input-${type}`} style={wrapStyle}>
	{#if type && type === 'textarea'}
		<textarea
			bind:this={input}
			on:input={handleInput}
			class={tw(inputClass, className)}
			{style}
			{maxlength}
			{value}
			{autofocus}
			{required}
			on:keydown
			on:mouseover
			on:mouseout
			on:change
			on:focus={(e) => (handleFocus(e), (focused = true))}
			on:blur={(e) => (handleBlur(e), (focused = false))}
		/>
		{#if sample}
			<div class="sample" class:isFocused={focused} class:hasValue={`${value}`.length > 0}>
				{sample}
			</div>
		{/if}
	{:else if type && type === 'select'}
		<input type="hidden" {name} {value} />
		<Select
			{placeholder}
			{required}
			items={options}
			bind:value
			bind:filterText
			bind:reload
			on:select
			on:mouseover
			on:mouseout
			on:focus
			on:blur
			{style}
			{containerStyles}
			{...extra}
			{...selectProps}
		>
			<slot name="empty" slot="empty" />
		</Select>
		<!-- {:else if type && type === 'sortableInputList'}
    <SortableInputList
      {placeholder}
      bind:values={value}
      {name}
      {...extra}
      on:disableForm
      on:enableForm
      on:mouseover
      on:mouseout
    /> -->
	{:else if type && type === 'switch'}
		<Switch
			label={placeholder}
			bind:value
			{name}
			{required}
			on:mouseover
			on:mouseout
			on:focus
			on:blur
			on:change
			{...extra}
		/>
		<!-- {:else if type === 'rich'}
    <div class="mb-0.5 text-sm font-medium text-black">
      {placeholder}
    </div>
    <Richtext
      bind:value
      class={className}
      on:mouseover
      on:mouseout
      on:focus
      on:blur
    /> -->
	{:else if type === 'number'}
		<input
			type="number"
			{name}
			{step}
			{min}
			{max}
			{required}
			{disabled}
			{readonly}
			class={tw(inputClass, className)}
			bind:this={input}
			on:input={handleInput}
			on:keydown
			on:change
			on:mouseover
			on:paste
			on:mouseout
			bind:value
			{maxlength}
			{autofocus}
			on:focus={(e) => (handleFocus(), (focused = true))}
			on:blur={(e) => (handleBlur(), (focused = false))}
		/>
	{:else}
		<input
			use:typeAction
			{name}
			{step}
			{min}
			{max}
			{required}
			{disabled}
			{readonly}
			class={tw(inputClass, className)}
			bind:this={input}
			on:input={handleInput}
			on:keydown
			on:change
			on:mouseover
			on:paste
			on:mouseout
			bind:value
			{maxlength}
			{autofocus}
			on:focus={(e) => (handleFocus(), (focused = true))}
			on:blur={(e) => (handleBlur(), (focused = false))}
		/>
	{/if}
	{#if !['switch', 'upload', 'multiselect', 'list', 'radioBoxes', 'sortableInputList', 'datepicker', 'rich', 'select'].includes(type)}
		<div
			class="placeholder placeholder-unfocused"
			class:isFocused={focused}
			class:isMounted={mounted}
			class:isDisabled={disabled || readonly}
			class:hasErrors
			class:hasValue={`${value}`.length > 0}
		>
			{placeholder}
		</div>
	{/if}
	{#if maxlength && showMaxLength}
		<div
			class="absolute right-0 top-0 mr-4 mt-3 text-xs text-slate-800 transition duration-300"
			class:text-red={maxlength - (value?.toString().length || 0) < 3}
			class:text-green={(value?.toString().length || 0) > 3}
		>
			{value?.toString().length || '0'}/{maxlength}
		</div>
	{/if}
	{#if hasErrors}
		<div class="error mt-1 text-xs font-medium text-red-700/80">{errors?.[name]?.[0]}</div>
	{:else if hint}
		<div class="hint ml-2 mt-1 text-xs font-medium leading-tight text-slate-400">
			{hint}
		</div>
	{/if}
</span>

<style lang="postcss">
	.sample {
		position: absolute;
		top: 1rem;
		font-size: 1rem;
		color: #b9b9b9;
		line-height: 120%;
		left: 1.4rem;
		opacity: 0;
		pointer-events: none;
		transition: all 100ms;
		&.isFocused {
			opacity: 1;
		}
		&.hasValue {
			opacity: 0;
		}
		&.hasErrors {
			@apply bg-red-50;
		}
	}
	span {
		--background: #fff;
		--border: 1px solid rgb(226 232 240);
		--border-hover: 1px solid rgb(226 232 240);
		--border-focused: 1px solid #10b98160;
		--border-radius: 12px;
		--placeholder-color: rgba(71, 85, 105, 0.9);
		--input-font-size: 0.9rem;
		--input-color: rgb(71 85 105);
		--border-focus-color: #10b981;
		--item-is-active-bg: #10b981;
		--item-hover-bg: #10b98120;
		--indicator-top: 18px;
		--list-border-radius: 12px;
		--list-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
		--indicator-right: var(--indicator-right, 16px);
		--indicator-color: #10b981;
		--font-size: 0.95rem;
		--selectHeight: 3.6rem;
		:global(.svelte-select) {
			height: var(--selectHeight, 3.75rem) !important;
		}
		:global(.svelte-select input) {
			font-weight: 600;
			font-size: 0.95rem;
		}
		:global(.svelte-select .value-container) {
			padding-bottom: 0;
			margin-bottom: 0;
		}
		:global(.svelte-select .chevron) {
			display: flex;
		}
		:global(.svelte-select .selected-item) {
			font-weight: 500;
			color: rgb(71 85 105) !important;
		}
		:global(.svelte-select > .chevron) {
			top: 0;
			bottom: 0;
			margin: auto;
		}
		:global(.svelte-select > .svelte-select-list) {
			z-index: 40;
		}
		:global(.svelte-select > .svelte-select-list > .listItem) {
			cursor: pointer;
		}
	}
	span {
		display: block;
		position: relative;
		width: var(--wrap-width, 100%);
		> input,
		> textarea {
			outline: none;
			width: 100%;
			font-size: 0.95rem;
			padding: 0.9rem;
			padding-top: 1.5rem;
			padding-bottom: 0.4rem;
			transition: all 0.2s;
			&:focus {
				/* border-color: #5ec39f7a; */
			}
		}
		.placeholder-unfocused {
			@apply text-slate-500;
			position: absolute;
			top: 1rem;
			left: 0.85rem;
			opacity: 1;
			transition: all 0.13s;
			pointer-events: none;
			background: transparent;
			padding: 0 0.4rem;
			font-weight: 500;
			font-size: 0.975rem;
			&.isMounted {
				opacity: 1;
			}
			&.isFocused,
			&.hasValue {
				@apply rounded-full  text-slate-400/80;
				top: 1px;
				left: 0.95rem;
				width: calc(100% - 2.05rem);
				padding-top: 0.4rem;
				padding-left: 0rem;
				background: white;
				opacity: 1;
				font-size: 0.775rem;
			}
			&.hasErrors {
				@apply bg-red-50;
			}
			&.isDisabled {
				@apply bg-gray-100;
			}
			&.isFocused {
				@apply text-emerald-500;
			}
		}
		label {
			font-weight: 600;
			margin-bottom: 0.3rem;
			display: block;
		}
	}
</style>
