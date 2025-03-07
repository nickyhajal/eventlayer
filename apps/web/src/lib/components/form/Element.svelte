<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { getMeContext } from '$lib/state/getContexts'
	import { trpc } from '$lib/trpc/client'

	import { Button, Markdown } from '@matterloop/ui'
	import { dispatch, getMediaUrl, tw } from '@matterloop/util'

	import Label from '../ui/label/label.svelte'
	import Uploader from '../ui/Uploader.svelte'
	import UserAvatar from '../UserAvatar.svelte'
	import Input from './Input.svelte'

	interface ReceiveProps {
		id?: string
		label?: string
		props?: any
		handleClick?: () => void
		class?: string
		min?: number
		max?: number
		component?: string
		shellClass?: string
		className?: string
		placeholder?: string
		hide?: boolean
		autofocus?: boolean
		name?: string
		style?: string
		options?: any
		multi?: boolean
		type?: string
		bind?: string
		info?: string
		containerStyles?: string
		classes?: string
		extra?: string
		hint?: string
		content?: string
	}

	let receiveProps: ReceiveProps = {}
	export { receiveProps as props }
	export let values = {}
	export let includedComponents
	const userContext = getMeContext()
	$: user = $userContext
	async function updateAvatar(mediaId: string) {
		const newUser = await trpc().user.upsert.mutate({ userId: user.id, mediaId })
		invalidateAll()
	}
	$: id = receiveProps.id
	$: label = receiveProps.label
	$: props = receiveProps.props
	$: handleClick = receiveProps.handleClick
	$: addedClass = receiveProps['class']
	$: min = receiveProps.min
	$: info = receiveProps.info
	$: max = receiveProps.max
	$: component = receiveProps.component
	$: autofocus = receiveProps.autofocus
	$: shellClass = receiveProps.shellClass
	$: className = receiveProps.className
	$: placeholder = receiveProps.placeholder
	$: hide = receiveProps.hide
	$: name = receiveProps.name
	$: style = receiveProps.style
	$: options = receiveProps.options
	$: multi = receiveProps.multi
	$: type = receiveProps.type
	$: bind = receiveProps.bind
	$: containerStyles = receiveProps.containerStyles
	$: classes = receiveProps.classes
	$: extra = receiveProps.extra
	$: hint = receiveProps.hint
	$: content = receiveProps.content
	name = id
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
	{:else if type === 'title'}
		<div
			class={tw`mb-2 mt-4 text-lg font-semibold text-slate-500 ${classes} ${addedClass} ${className}`}
		>
			{content}
		</div>
	{:else if type === 'avatar'}
		{#if user?.id}
			<div class="flex flex-col items-start justify-center gap-1 mb-2">
				<Label for="image" class="text-right">{label}</Label>
			</div>
			<div
				class="flex items-center gap-2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 p-1"
			>
				{#if user.photo}
					<UserAvatar {user} />
				{/if}
				<div class="w-full bg-stone-100 h-full">
					<Uploader
						parentId={user.id}
						parentType="user"
						onSuccess={updateAvatar}
						class="h-full"
						defaultMessage="Drag & Drop your photo or <span class='filepond--label-action'> Click to Browse </span>"
					/>
				</div>
			</div>
		{/if}
	{:else if type === 'markdown'}
		<Markdown data={content} class={tw(`font-medium text-slate-500 ${className}`)} />
	{:else if type === 'button'}
		<Button class={tw(`${className} ${addedClass}`)} on:click={() => handleClick && handleClick()}>
			{label}</Button
		>
	{:else if type === 'space'}
		<div />
	{:else}
		<Input
			class={className || addedClass}
			{label}
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
			{info}
			{autofocus}
			{multi}
			{style}
			{...props}
			on:mouseover={() => $dispatch('mouseover', { field: receiveProps })}
			on:change
			on:keydown
			on:disableForm
			on:enableForm
			bind:value={values[id]}
			type={type || 'input'}
		/>
	{/if}
</div>
