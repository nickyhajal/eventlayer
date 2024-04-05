<script lang="ts">
import { goto } from '$app/navigation'
import FormElements from '$lib/components/form/FormElements.svelte'
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
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
let onPage = 0
const elementsByPage = groupBy(data.form?.elements, 'page')
const elementsListedByPage = Object.values(elementsByPage)
async function submit(e) {
	if (e.stopPropagation) {
		e.stopPropagation()
		e.preventDefault()
	}
	if (data.me.id) {
		const res = await trpc().formSession.submit.mutate({
			formId: data.form?.id,
			sessionId,
			responses: Object.entries(values).flatMap(([id, value]) => (value ? [{ id, value }] : [])),
		})
		if (res?.[0]?.sessionId) {
			sessionId = res[0].sessionId
		}
	}
}
async function next(e) {
	if (onPage === elementsListedByPage.length - 1) {
		await trpc().user.upsert.mutate({ id: data.me.id, userId: data.me.id, onboardStatus: 'done' })
		goto(`/`)
		return
	}
	onPage += 1
	scrollElm.scrollTo({
		top: document.getElementById(`page-${onPage}`)?.offsetTop,
		behavior: 'smooth',
	})
	await submit(e)
}
</script>

<Screen title="Welcome!">
	<form on:submit={(e) => submit(e)} class="">
		<div class="mx-auto h-[95vh] max-w-lg overflow-hidden px-2 lg:h-[80vh]" bind:this={scrollElm}>
			{#each Object.values(elementsByPage) as page, i}
				<div id="page-{i}" class=""></div>
				<div
					class="relative top-[5%] flex h-[73.3vh] flex-col justify-start gap-3 transition-all duration-300 lg:top-[15%] {onPage === i ? 'opacity-100' : 'opacity-0'}"
				>
					<FormElements elements={page} bind:values={values} shouldAutoFocus={i === 0} />
					<Button
						class="mt-8 w-52 border border-b-2 border-emerald-500/20 border-b-emerald-500/20 bg-emerald-100/20 py-5 font-semibold  text-emerald-600 shadow-none hover:bg-emerald-100/60"
						type="button"
						on:click={next}>{i === elementsListedByPage.length -1  ? 'Done' : 'Continue'}</Button
					>
				</div>
			{/each}
		</div>
	</form>
</Screen>

<style>
</style>
