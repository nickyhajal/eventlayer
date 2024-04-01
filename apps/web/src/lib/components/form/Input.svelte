<script lang="ts">
import { createEventDispatcher, onMount, type ComponentProps } from 'svelte'
import type { Action } from 'svelte/action'

import { tw } from '@matterloop/util'

import Input from '../ui/input/input.svelte'
import Switch from '../ui/switch/switch.svelte'
import Textarea from '../ui/textarea/textarea.svelte'
import Select from './Select.svelte'

let className = ''

export { className as class }
export let value: string | number | null | undefined | string[] = ''
export let type = 'text'
export let hint = ''
export let label = ''
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
$: inputClass = ` read-only:bg-gray-100 read-only:cursor-not-allowed disabled:cursor-not-allowed  ${className} ${
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
</script>

{#if label}
	<label class="block w-9/12 pb-1 text-[0.875rem] font-medium text-slate-700" for={name}
		>{label}</label
	>
{/if}
<span class={`${className} input-${type}`} style={wrapStyle}>
	{#if type && type === 'textarea'}
		<Textarea
			bind:this={input}
			on:input={handleInput}
			class={inputClass}
			style={style}
			maxlength={maxlength}
			value={value}
			autofocus={autofocus}
			required={required}
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
		<input type="hidden" name={name} value={value} />
		<Select
			placeholder={placeholder}
			required={required}
			items={options}
			bind:value={value}
			on:select
			on:mouseover
			on:mouseout
			on:focus
			on:blur
			class={className}
		></Select>
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
			bind:value={value}
			name={name}
			required={required}
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
		<Input
			type="number"
			name={name}
			step={step}
			min={min}
			max={max}
			required={required}
			disabled={disabled}
			readonly={readonly}
			class={tw(className)}
			on:input={handleInput}
			on:keydown
			on:change
			on:mouseover
			on:paste
			bind:value={value}
			maxlength={maxlength}
			autofocus={autofocus}
			on:focus={(e) => (handleFocus(), (focused = true))}
			on:blur={(e) => (handleBlur(), (focused = false))}
		/>
	{:else}
		<Input
			name={name}
			step={step}
			min={min}
			max={max}
			required={required}
			disabled={disabled}
			readonly={readonly}
			class={tw(className)}
			on:input={handleInput}
			on:keydown
			on:change
			on:mouseover
			on:paste
			bind:value={value}
			maxlength={maxlength}
			autofocus={autofocus}
			on:focus={(e) => (handleFocus(), (focused = true))}
			on:blur={(e) => (handleBlur(), (focused = false))}
		/>
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
</style>
