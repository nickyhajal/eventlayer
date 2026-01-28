<script lang="ts">
	import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
	import Portal from 'svelte-portal'

	import { dispatch, tw } from '@matterloop/util'

	export let open = false
	export let allowOverlayClose = true
	export let width = '200'
	export let modalClass = 'overflow-y-auto'
	export let overlayClass = ''
	let overlay: HTMLDivElement
	let visible = false
	let modalElm: HTMLDivElement

	function toggle() {
		open = !open
	}

	$: {
		if (open) {
			setTimeout(() => {
				visible = true
			}, 20)
		} else {
			setTimeout(() => {
				visible = false
			}, 20)
		}
	}
	$: {
		if (modalElm) {
			if (open) {
				disableBodyScroll(modalElm)
			} else {
				enableBodyScroll(modalElm)
			}
		}
	}

	function overlayClick({ target }: MouseEvent | KeyboardEvent) {
		if (allowOverlayClose && target === overlay) {
			open = false
			$dispatch('close')
		}
	}
	// @include below(bigphone) {
	//   position: fixed;
	//   width: 96%;
	//   top: 8%;
	//   left: 0;
	//   transform: none;
	//   height: fit-content;
	//   margin: auto;
	// }
</script>

{#if open}
	<Portal target=".portals">
		<div
			class={`overlay
        ${tw(
					`fixed left-0 top-0 h-screen w-screen bg-black bg-opacity-60 opacity-${
						visible ? '100' : '0'
					} transition-all duration-200 ${overlayClass}`,
				)}
      `}
			bind:this={overlay}
			on:click={overlayClick}
			on:keydown={overlayClick}
		>
			<div
				bind:this={modalElm}
				class={tw(
					`modal margin-0 absolute left-0 right-0 -mt-[10vh] w-full rounded-2xl bg-white shadow-2xl transition-all delay-150 duration-200 lg:max-w-lg opacity-${
						visible ? '100' : '0'
					}`,
					modalClass,
				)}
			>
				<slot />
			</div>
		</div>
	</Portal>
{/if}

<style lang="postcss">
	.overlay {
		z-index: 500;
		backdrop-filter: blur(3px);
	}
	.modal {
		top: 49%;
		left: 50%;
		transform: translate(-50%, -50%);
		max-height: calc(100vh - 5rem);
		:global(.content) {
			max-height: calc(100vh - 14rem);
			padding-bottom: 1rem;
			overflow: auto;
		}
	}
</style>
