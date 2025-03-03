<script lang="ts">
	import { goto } from '$app/navigation'
	import FormElements from '$lib/components/form/FormElements.svelte'
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import { NextButton } from '$lib/components/ui/calendar/index.js'
	import { trpc } from '$lib/trpc/client.js'
	import { onMount } from 'svelte'

	import { groupBy } from '@matterloop/util'

	export let data
	let scrollElm: HTMLElement
	$: sessionId = data.session?.id
	let values: Record<string, string> = data.form?.elements.reduce(
		(out, curr) => {
			out[curr.id] =
				data.session?.responses?.find(({ elementId }) => elementId === curr.id)?.value || ''
			return out
		},
		{} as Record<string, string>,
	)
	let onPage = -1
	const elementsByPage = groupBy(data.form?.elements, 'page')
	const elementsListedByPage = Object.values(elementsByPage)
	let lastValues = { ...values }
	onMount(() => {
		next()
	})
	async function submit(e: Event | null) {
		if (e?.stopPropagation) {
			e.stopPropagation()
			e.preventDefault()
		}
		if (data.me.id) {
			let responses = Object.entries(values).flatMap(([id, value]) =>
				value && value !== lastValues[id] ? [{ id, value }] : [],
			)
			if (responses.length) {
				const res = await trpc().formSession.submit.mutate({
					formId: data.form?.id,
					sessionId,
					responses,
				})
				if (res?.[0]?.sessionId) {
					sessionId = res[0].sessionId
				}
			}
			lastValues = { ...values }
		}
	}
	async function next(e = null) {
		if (onPage === elementsListedByPage.length - 1) {
			await trpc().user.upsert.mutate({ id: data.me.id, userId: data.me.id, onboardStatus: 'done' })
			window.close()
			// goto(`/`)
			return
		}
		onPage += 1
		scrollToCurrent()
		if (onPage > 0) {
			await submit(e)
		}
	}
	function prev() {
		if (onPage > 0) {
			onPage -= 1
			scrollToCurrent()
		}
	}
	function scrollToCurrent() {
		const page = document.getElementById(`page-${onPage}`)
		scrollElm.scrollTo({
			top: page?.offsetTop,
			behavior: 'smooth',
		})
	}
</script>

<Screen title="Welcome!">
	<form on:submit={(e) => submit(e)} class="pt-safe-offset-8 lg:pt-0">
		<div class="bg-image fixed w-full top-0 left-0 z-10 h-full opacity-30"></div>
		<div
			class="relative mx-auto h-[95vh] max-w-lg overflow-hidden px-2 lg:h-[80vh] z-20"
			bind:this={scrollElm}
		>
			{#each Object.values(elementsByPage) as page, i}
				<!-- <div id="page-{i}" class="h-16 w-full"></div> -->
				<div
					id="page-{i}"
					class="relative top-[25%] mt-24 flex h-[80vh] flex-col justify-start gap-3 transition-all duration-300 lg:top-[15%] {onPage ===
					i
						? 'opacity-100'
						: 'opacity-0'}"
				>
					<FormElements elements={page} bind:values shouldAutoFocus={i === 0} />
					<div class="mt-8 flex w-full items-center justify-between">
						<div class=" w-fit">
							{#if i > 0}
								<Button
									class="text-slate-600/70 rounded-full"
									variant="ghost"
									type="button"
									on:click={() => prev()}>Back</Button
								>
							{/if}
						</div>
						<!-- class="border-a-accent/10 border-b-a-accent/10 bg-a-accent/5 text-a-accent hover:bg-a-accent/10 w-52 border border-b-2 py-5  font-semibold shadow-none brightness-90" -->
						{#if i < elementsListedByPage.length - 1}
							<Button
								class="rounded-full bg-[#060C3A] text-white px-12 py-4 h-14 text-base tracking-wide"
								type="button"
								on:click={next}
								>{i === elementsListedByPage.length - 1 ? 'Done' : 'Continue'}</Button
							>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</form>
</Screen>

<style>
	.bg-image {
		background-image: url('https://framerusercontent.com/images/EErxJcrmRQPI1Li7WAZRMIU.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}
</style>
