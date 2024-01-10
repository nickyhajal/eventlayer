<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'

	import DragDropList from '../DragDropList.svelte'

	const dispatch = createEventDispatcher()
	export let values = []
	export let placeholder
	export let buttonMessage
	export let maxlength = false
	export let postComponent = false
	export let showNumber = true
	let shell
	let currentValue = ''

	onMount(() => {
		shell.querySelector('.dragdroplist').addEventListener('click', (e) => {
			e.preventDefault()
			e.stopPropagation()
			if (e.target.classList.contains('remove')) {
				remove(e.target.dataset.inx)
			}
		})
	})

	function add() {
		if (currentValue.length > 3) {
			while (values.includes(currentValue)) {
				currentValue += ' (Copy)'
			}
			values = [...values, { id: false, val: currentValue }]
			currentValue = ''
		}
	}
	function remove(inx) {
		values = values.filter((v, i) => i !== +inx)
	}
	function updateOrder() {}
	$: {
		if (currentValue) {
			dispatch('disableForm')
		} else {
			dispatch('enableForm')
		}
	}
</script>

<div class="shell" bind:this={shell}>
	<div class="mb-4 flex h-12 w-full">
		<form class="flex h-full w-full" on:submit|preventDefault|stopPropagation={add}>
			<div class="relative flex-1">
				<input
					type="text"
					name="blank"
					{maxlength}
					class="flex h-full w-full flex-1 rounded-l border-2 border-r-0 border-gray-100 p-3"
					bind:value={currentValue}
					{placeholder}
				/>
				{#if maxlength}
					<div
						class="absolute top-0 right-0 mt-1 mr-2 text-xs text-gray-400 transition duration-300"
						class:text-red={maxlength - currentValue.length < 3}
					>
						{currentValue.length}/{maxlength}
					</div>
				{/if}
			</div>
			<button
				class="block h-full w-40 rounded-r bg-emerald-500 p-2 px-8 pt-2 pb-1 text-base text-white"
				>{buttonMessage}</button
			>
		</form>
	</div>
	<div>
		<div class="relative w-full">
			<DragDropList
				bind:data={values}
				template={(
					val,
					i
				) => `<div class="flex justify-between w-full p-4 py-2 mb-2 rounded bg-emerald-75"><div class="flex items-center">${
					showNumber
						? `<div class="w-5 mr-4 text-xl font-semibold text-center text-gray">${i + 1}.</div>`
						: ''
				}${
					val.val
				}</div><button data-inx="${i}" class="h-full px-1 -mr-3 remove"><svg xmlns="http://www.w3.org/2000/svg" fill="none" class="w-6 h-6 transition duration-300 remove text-gray hover:text-red" data-inx="${i}" viewBox="0 0 24 24" stroke="currentColor">
          <path class="remove" data-inx="${i}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg></button></div>`}
				on:dragend={updateOrder}
			/>
			{#if !values.length}
				<div class="mb-4 text-center font-semibold text-gray">Your steps will appear here</div>
			{/if}
			<slot />
			{#if postComponent}
				<svelte:component this={postComponent} />
			{/if}
		</div>
	</div>
</div>

<style>
	.shell :global(.item) {
		width: 100%;
	}
</style>
