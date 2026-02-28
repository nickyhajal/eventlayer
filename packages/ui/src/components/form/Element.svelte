<script lang="ts">
	import { dispatch, tw } from '@matterloop/util'

	import Button from './Button.svelte'
	import Input from './Input.svelte'

	let receiveProps = {}
	export { receiveProps as props }
	export let values = {}
	export let includedComponents
	let {
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
	} = receiveProps
	component = component || includedComponents[options?.component || '']
</script>

<div class={tw(`flex-grow ${shellClass}`)}>
	{#if typeof component !== 'undefined'}
		<svelte:component
			this={component}
			{classes}
			placeholder={placeholder || ''}
			{...props ? (typeof props === 'function' ? props({ values }) : props) : {}}
			bind:value={values[name || bind || 'bindcatch']}
		/>
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
			{containerStyles}
			{extra}
			{min}
			{max}
			{name}
			{hint}
			{multi}
			{style}
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
