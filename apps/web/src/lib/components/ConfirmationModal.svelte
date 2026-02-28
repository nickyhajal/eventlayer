<script>
	import { confirmations } from '$lib/util/confirmationDialogs'

	import { Modal } from '@matterloop/ui'
	import { tw } from '@matterloop/util'

	export let open = true
	export let type = 'confirmation'
	export let confirmationTitle = 'Are you sure you want to delete this?'
	export let confirmationText = ''
	export let confirmationButtonClass = ''
	export let confirmationLabel = 'Delete'
	export let alertLabel = 'Ok'
	export let cancelButtonClass = ''
	export let cancelLabel = 'Nevermind'
	export let handleConfirm = () => {}
</script>

<Modal bind:open allowOverlayClose={false}>
	<div class="">
		<div class=" p-10 pb-8">
			{#if confirmationTitle}
				<h3 class="text-xl">{confirmationTitle}</h3>
			{/if}
			{#if confirmationText}
				<p class="w-9/12 pt-6 text-lg leading-snug text-slate-800">
					{confirmationText}
				</p>
			{/if}
		</div>
		<div class="bg-slate flex w-full items-center justify-end gap-4 px-6 py-2.5">
			{#if type === 'confirmation'}
				<button
					class="{tw(
						'bg-slate rounded-2xl px-6 py-3 text-base font-semibold transition-all duration-200 hover:bg-slate-600',
						cancelButtonClass,
					)}}"
					on:click={() => {
						open = false
						setTimeout(() => {
							confirmations.pop()
						}, 220)
					}}>{cancelLabel}</button
				>
				<button
					class={tw(
						'bg-red rounded-xl px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-red-600 hover:bg-opacity-90',
						confirmationButtonClass,
					)}
					on:click={(e) => {
						open = false
						setTimeout(() => {
							confirmations.pop()
						}, 220)
						handleConfirm(e)
					}}>{confirmationLabel}</button
				>
			{:else}
				<button
					class={tw(
						'rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-white transition-all duration-200 hover:bg-emerald-600 hover:bg-opacity-90',
						confirmationButtonClass,
					)}
					on:click={(e) => {
						open = false
						setTimeout(() => {
							confirmations.pop()
						}, 220)
						handleConfirm(e)
					}}>{alertLabel || 'Ok'}</button
				>
			{/if}
		</div>
	</div>
</Modal>
