<script lang="ts">
import { Button, Input, Markdown } from '@matterloop/ui'
import { dispatch, tw } from '@matterloop/util'

let receiveProps = {}
export { receiveProps as props }
export let values = {}
export let includedComponents
let {
	id,
	props,
	handleClick,
	class: addedClass,
	label,
	min,
	max,
	component,
	shellClass,
	className,
	placeholder,
	hide,
	name,
	style,
	options,
	multi,
	type,
	bind,
	containerStyles,
	classes,
	extra,
	hint,
	content,
} = receiveProps
name = id
component = component || includedComponents[options?.component || '']
</script>

<div class={tw(`flex-grow ${shellClass}`)}>
	{#if typeof component !== 'undefined'}
		<svelte:component
			this={component}
			classes={classes}
			placeholder={placeholder || ''}
			{...props ? (typeof props === 'function' ? props({ values }) : props) : {}}
			bind:value={values[name || bind || 'bindcatch']}
		/>
	{:else if type === 'title'}
		<div class="mb-2 mt-4 text-lg font-semibold text-slate-500">{label}</div>
	{:else if type === 'markdown'}
		<Markdown data={content} />
	{:else if type === 'button'}
		<Button class={tw(`${className} ${addedClass}`)} on:click={() => handleClick && handleClick()}>
			{label}</Button
		>
	{:else if type === 'space'}
		<div />
	{:else}
		<Input
			class={className || addedClass}
			placeholder={typeof placeholder === 'function'
				? placeholder({ values })
				: placeholder || label}
			options={typeof options === 'function' ? options() : options}
			containerStyles={containerStyles}
			extra={extra}
			min={min}
			max={max}
			name={name}
			hint={hint}
			multi={multi}
			style={style}
			{...props}
			on:mouseover={() => $dispatch('mouseover', { field: receiveProps })}
			on:change
			on:keydown
			on:disableForm
			on:enableForm
			bind:value={values[name || bind]}
			type={type || 'input'}
		/>
	{/if}
</div>
