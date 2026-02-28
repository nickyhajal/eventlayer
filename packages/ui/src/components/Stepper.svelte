<script>
	import { onMount } from 'svelte'

	import { dispatch } from '@matterloop/util'

	import Fields from './form/Fields.svelte'

	export let fields
	export let values
	export let beforeNext = false
	export let validate = false
	export let on = 0
	export let steps = []
	export let ended = false
	let furthest = on
	export const shift = async (dir) => {
		const newOn = on + dir

		// Validate if set
		let isValid = true
		if (validate && newOn > furthest) {
			isValid = validate()
		}
		if (!isValid) return

		// Check if will overflow
		if (newOn > steps.length) {
			$dispatch('step-overflow-end')
			return
		} else if (newOn < 0) {
			$dispatch('step-overflow-start')
			return
		}
		if (dir > 0) {
			if (beforeNext) {
				const canProceed = await beforeNext()
				if (!canProceed) return false
			}
			$dispatch('step-forward')
			$dispatch('next')
		} else {
			$dispatch('step-back')
		}
		if (newOn === steps.length) {
			if (!ended) {
				$dispatch('step-end')
				ended = true
			}
		} else if (newOn > -1) {
			on = newOn
			if (newOn > furthest) furthest = newOn
		}
	}
	export const next = () => shift(1)
	export const back = () => shift(-1)
	onMount(() => {
		if (fields) {
			steps = fields.reduce((out, curr) => {
				if (curr.title) {
					out.push([curr])
				} else {
					out[out.length - 1].push(curr)
				}
				return out
			}, [])
		}
	})
	function handleKeydown(e) {
		const target = e.target
		if (e.keyCode === 13 && target.tagName !== 'TEXTAREA' && !target?.isContentEditable) {
			next()
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />
<div>
	{#if steps && steps[on]}
		{#if fields}
			<Fields fields={steps[on]} bind:values />
		{:else}
			<slot />
		{/if}
	{/if}
</div>
