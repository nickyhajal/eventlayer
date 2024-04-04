<script lang="ts">
import { Button } from '$lib/components/ui/button'
import Input from '$lib/components/ui/input/input.svelte'
import { Textarea } from '$lib/components/ui/textarea'
import { trpc } from '$lib/trpc/client.js'
import Plus from 'lucide-svelte/icons/plus'
import { toast } from 'svelte-sonner'

import type { Content } from '@matterloop/db'

import AdminScreen from '../AdminScreen.svelte'

export let data

let content = data.content
let lastContent = content.map((c) => JSON.stringify(c))

function addContent() {
	content = [...content, { key: '', body: '', type: 'string', ord: content.length }]
}
async function save() {
	const toSave: Content[] = []
	content.forEach((c, i) => {
		if (JSON.stringify(c) !== lastContent[i]) {
			toSave.push(c)
		}
	})
	await Promise.all(toSave.map((c) => trpc().content.upsert.mutate(c)))
	toast.success('Saved Content')
}
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-3" slot="title">
		<div class="text-2xl font-semibold">Content Strings</div>
	</div>

	<div class="mt-4 flex w-full flex-col overflow-hidden rounded-xl bg-stone-100">
		<div class=" divide-x py-1 odd:bg-stone-200/40"></div>
		<div></div>
		{#each content as { id, title, body }, i}
			<div class="grid grid-cols-[12rem_1fr] gap-2 divide-x px-6 py-2 odd:bg-stone-200/40">
				<div class="text-base font-medium">
					<Input bind:value={content[i].key} class="w-full bg-white" placeholder="Content Key" />
				</div>
				<div class="text-base font-medium">
					<Input bind:value={content[i].body} class="w-full bg-white " placeholder="Content" />
				</div>
			</div>
		{/each}
		<div class="px-6 py-4">
			<Button variant="outline" class="h-7 w-80 bg-white p-4" on:click={addContent}>
				<Plus class="mr-1 w-[1rem] text-slate-700" />
				Add Content String
			</Button>
		</div>
	</div>
	{#if content.length}
		<Button class="mt-4" on:click={save}>Save</Button>
	{/if}
</AdminScreen>
