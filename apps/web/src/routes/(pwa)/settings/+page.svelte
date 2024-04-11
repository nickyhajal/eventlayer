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
let status = 'ready'
$: sessionId = data.session?.id
let values: Record<string, string> = data.form?.elements.reduce(
	(out, curr) => {
		out[curr.id] =
			data.session?.responses?.find(({ elementId }) => elementId === curr.id)?.value || ''
		return out
	},
	{} as Record<string, string>,
)
async function submit(e) {
	if (e.stopPropagation) {
		e.stopPropagation()
		e.preventDefault()
	}
	if (data.me.id) {
		status = 'saving'
		const res = await trpc().formSession.submit.mutate({
			formId: data.form?.id,
			sessionId,
			responses: Object.entries(values).flatMap(([id, value]) => (value ? [{ id, value }] : [])),
		})
		if (res?.[0]?.sessionId) {
			sessionId = res[0].sessionId
		}
		status = 'success'
		setTimeout(() => {
			status = 'ready'
		}, 1000)
	}
}
let elements = data.form?.elements
let lastPage = elements[elements.length - 1].page
let visibleElements = elements.filter(({ page }) => page > 0 && page !== lastPage)
</script>

<Screen title="Settings" bigTitle="Settings">
	<form on:submit={(e) => submit(e)} class="pt-safe-offset-8 relative top-6 lg:pt-0">
		<div class="relative mx-auto flex max-w-lg flex-col gap-5 px-2" bind:this={scrollElm}>
			<FormElements elements={visibleElements} bind:values={values} shouldAutoFocus={true} />
			<Button
				class="border-a-accent/10 border-b-a-accent/10 bg-a-accent/5 text-a-accent hover:bg-a-accent/10 mt-8 w-52 border border-b-2 py-5  font-semibold shadow-none brightness-90"
				type="submit"
				>{status === 'ready' ? 'Save' : status === 'success' ? 'Saved!' : 'Saving...'}</Button
			>
		</div>
	</form>
</Screen>

<style>
</style>
