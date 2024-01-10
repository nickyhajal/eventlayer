<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import Select from 'svelte-select'

	export let items
	export let value // string or string[]
	export let placeholder
	export let label
	export let style
	export let containerStyles
	export let filterText = ''
	export let loadOptions
	export let reload

	export let multiple = false
	export let clearable = false
	export let isSearchable = false

	const dispatch = createEventDispatcher()

	let selectedValue

	$: {
		if (Array.isArray(value)) {
			selectedValue = items.filter((item) => value.includes(item.value))
		} else {
			selectedValue = items.find((item) => item.value === value)
		}
	}

	function onSelect(event) {
		if (!event.detail) {
			value = undefined
		} else if (Array.isArray(event.detail)) {
			value = event.detail.map((opt) => opt.value)
		} else {
			value = event.detail.value
		}
	}
</script>

<span>
	<Select
		{items}
		{style}
		value={selectedValue}
		{isSearchable}
		{multiple}
		{loadOptions}
		{placeholder}
		{containerStyles}
		{clearable}
		bind:debounce={reload}
		bind:filterText
		on:select={(e) => {
			dispatch('select', e.detail)
			onSelect(e)
		}}
		on:clear={() => (value = undefined)}
	>
		<slot name="empty" slot="empty" />
	</Select>
</span>
