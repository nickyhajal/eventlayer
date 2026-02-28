<script lang="ts">
	import { XMark } from '@steeze-ui/heroicons'
	import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock'
	import { createEventDispatcher, onMount } from 'svelte'
	import Portal from 'svelte-portal'
	import { expoIn, expoOut } from 'svelte/easing'
	import { fade, fly } from 'svelte/transition'

	import { isIos, reverse, v4 } from '@matterloop/util'

	import HeroIcon from './HeroIcon.svelte'

	export let open = false
	export let size = 'lg'
	export let showFooterOnScroll = false
	export let allowOverlayClose = true
	export let closePosition = 'right'
	export let shouldPad = true
	export let width = '50rem'
	export let title = ''
	export let color = ''
	export let context = ''
	const dispatch = createEventDispatcher()
	let elmId
	let content
	let modalElm
	let opened = false
	let headerElm
	let scrolled = false
	let overlay
	let stacked = false
	let colors = {
		green: ['from-emerald-200 opacity-70'],
		bluegray: ['from-slate-700 opacity-60'],
		blue: ['from-blue-100 opacity-30'],
		orange: ['from-orange-100 opacity-70'],
	}

	onMount(() => {
		elmId = v4()
		setTimeout(() => (opened = true), 100)
	})

	export function scrollTo(args) {
		if (content?.scrollTo) {
			content.scrollTo(args)
		}
	}
	function processStack(shift = 0) {
		let existing = [...document.querySelectorAll('.sheets > div .modal')]
		if (shift) {
			existing.pop()
		}
		setTimeout(checkBodyScroll, 100)
		setTimeout(checkBodyScroll, 200)
		setTimeout(checkBodyScroll, 500)
		stacked = existing.length > 1
		if (existing.length === 0 && isIos()) {
			const root = document.getElementsByTagName('html')[0]
			root.classList.add('force-ios-bar')
			setTimeout(() => {
				root.classList.remove('force-ios-bar')
			}, 300)
		}
		reverse([...existing]).forEach((elm, i) => {
			elm.style.transform = `scaleX(${1 - i * 0.05}) translateY(${-2 * i}rem)`
		})
	}

	function stackable() {
		setTimeout(() => processStack(), 10)
		return {
			destroy() {
				processStack()
			},
		}
	}

	function checkBodyScroll() {
		const existing = document.querySelectorAll('.sheets > div .modal')
		if (existing.length) {
			if (content) {
				const scrollable = content.querySelector('.overflow-y-auto') || content
				disableBodyScroll(scrollable)
			}
		} else clearAllBodyScrollLocks()
	}

	function toggle() {
		open = !open
		if (!open) {
		}
	}

	function overlayClick({ target, currentTarget }) {
		if (allowOverlayClose && target === overlay) {
			open = false
		}
	}
	function handleKeydown(e) {
		if (e.keyCode === 27) {
			const existing = document.querySelectorAll('.sheets > div .modal')
			if (existing?.[existing?.length - 1]?.id === elmId) {
				open = false
			}
		}
	}

	$: {
		if (!open) {
			dispatch('close')
			scrolled = false
			scrollTo({ top: 0 })
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />
{#if open}
	<Portal target=".sheets">
		<div
			use:stackable
			class={`modal-shell overlay fixed left-0 top-0 h-screen w-screen overflow-hidden bg-opacity-60 ${
				stacked ? 'bg-transparent' : 'bg-black'
			}`}
			bind:this={overlay}
			style={`--modal-width: ${width}`}
			on:click={overlayClick}
			in:fade|local={{ duration: 200 }}
			on:outrostart={() => processStack(1)}
			out:fade|local={{ duration: 250, delay: 50 }}
		>
			<div
				id={elmId}
				bind:this={modalElm}
				in:fly|local={{
					duration: 300,
					delay: 50,
					y: window.innerHeight,
					easing: expoOut,
				}}
				out:fly|local={{ duration: 150, y: window.innerHeight, easing: expoIn }}
				class={`
          ${open ? 'open' : 'closed'} 
          ${size === 'lg' ? 'w-full' : size === 'md' ? 'md:w-10/12 md:max-w-7xl' : ''} 
          modal rounded-t-4xl fixed bottom-0 left-0 right-0 mx-auto h-full overflow-y-auto overflow-x-hidden bg-white transition-all duration-200
        `}
			>
				{#if color}
					<div
						class={`pointer-events-none absolute left-0 top-0 bg-gradient-to-b ${colors[color].join(
							' ',
						)} z-10 h-44 w-full`}
					/>
				{/if}
				<div
					class={`absolute left-0 right-0 top-0 z-30 mx-auto w-full transition-all duration-150 ${
						scrolled
							? `${title ? 'bg-white pt-4' : 'bg-transparent pt-0'}  scrolled bg-opacity-95 `
							: 'bg-transparent bg-opacity-0 pt-16'
					}`}
					bind:this={headerElm}
				>
					<button
						on:click={toggle}
						class={`absolute top-0 h-11 w-11  rounded-full bg-white  bg-opacity-80 p-1 text-slate-800 transition-all duration-150 lg:h-10 lg:w-10  lg:p-0 ${
							closePosition === 'right'
								? `right-0 mr-6 lg:mr-16 ${scrolled ? 'mt-4 lg:mt-5' : 'mt-4 lg:mt-16'}`
								: 'left-0 ml-4 mt-4 lg:ml-5'
						}`}><HeroIcon src={XMark} /></button
					>
					{#if context}<h4
							class="font-body mx-auto mb-0 w-4/5 text-center text-base font-normal text-gray-600"
						>
							{context}
						</h4>{/if}
					{#if title}<h3
							class={`font-display mx-auto w-4/5 text-center font-semibold text-black transition-all duration-150 ${
								scrolled ? 'text-xl' : 'text-[1.7rem]'
							}`}
						>
							{title}
						</h3>{/if}
				</div>
				<div
					on:scroll={(e) => {
						scrolled = e.target.scrollTop > 22 ? true : false
					}}
					bind:this={content}
					class={`content relative z-20 grid h-full ${
						shouldPad && 'pb-10'
					} overflow-y-auto overflow-x-hidden`}
					style={`grid-template-rows: 1fr auto; padding-top: ${
						shouldPad && headerElm && (title || context)
							? headerElm.offsetTop + headerElm.clientHeight + 12
							: 0
					}px`}
				>
					<slot />
					{#if $$slots.footer && showFooterOnScroll}
						<div
							transition:fly|local={{ y: 50, duration: 200 }}
							class="footer sticky bottom-0 flex items-center border-t-2 border-slate-600 bg-white py-3"
						>
							<div class="mx-auto w-full max-w-[44rem]">
								<slot name="footer" />
							</div>
						</div>
					{/if}
					{#if $$slots.rawFooter}
						<div class="sticky bottom-0">
							<slot name="rawFooter" />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Portal>
{/if}

<style>
	.overlay {
		z-index: 500;
	}
	.modal {
		height: calc(100vh - 5rem);
		height: calc((var(--vh, 1vh) * 100) - 5rem);
		box-shadow:
			0px -12px 80px rgba(0, 0, 0, 0.28),
			0px -2.68036px 17.869px rgba(0, 0, 0, 0.16691),
			0px -0.798012px 5.32008px rgba(0, 0, 0, 0.11309);
	}
	.stackedBack {
		transform: scaleX(0.95) scaleY(0.95) translateY(-3rem);
	}
	.footer {
		padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
	}
</style>
