<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import { Textarea } from '$lib/components/ui/textarea'
import { trpc } from '$lib/trpc/client.js'
import Plus from 'lucide-svelte/icons/plus'
import X from 'lucide-svelte/icons/x'
import { toast } from 'svelte-sonner'

import type { Content } from '@matterloop/db'
import { getId } from '@matterloop/util'

import AdminScreen from '../AdminScreen.svelte'

export let data

let content = data.content
let lastContent = content.map((c) => JSON.stringify(c))

function addContent() {
	content = [...content, { title: '', body: '', type: 'faq', ord: content.length }]
}
async function save() {
	const toSave: Content[] = []
	content.forEach((c, i) => {
		if (JSON.stringify(c) !== lastContent[i]) {
			if (!c.id) {
				c.id = getId()
			}
			toSave.push(c)
		}
	})
	await Promise.all(toSave.map((c) => trpc().content.upsert.mutate(c)))
	toast.success('Saved FAQs')
}
async function deleteContent(id: string) {
	content = content.filter((c) => c.id !== id)
	await trpc().content.delete.mutate({ id })
}
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-3" slot="title">
		<div class="text-2xl font-semibold">FAQs</div>
	</div>

	<div class="mt-4 flex w-6/12 min-w-[42rem] flex-col overflow-hidden rounded-lg bg-stone-100/30">
		<div class=" divide-x odd:bg-stone-200/40"></div>
		<div></div>
		{#each content as { id, title, body }, i}
			<div class="group grid grid-cols-2 gap-2 divide-x px-4 py-4 odd:bg-stone-200/30">
				<div class="text-base font-medium">
					<Textarea bind:value={content[i].title} class="w-full bg-white" placeholder="Question" />
				</div>
				<div class="grid grid-cols-[1fr_1rem] text-base font-medium">
					<Textarea bind:value={content[i].body} class="w-full bg-white" placeholder="Body" />
					<Button
						variant="ghost"
						class="my-0 ml-1 h-6 w-6 bg-white/50 px-1 py-2 opacity-0 transition-all hover:bg-white/80 group-hover:opacity-100"
						on:click={() => {
									deleteContent(content[i].id)
									invalidateAll()
								}}
					>
						<X class="h-4 w-4 text-stone-500"></X>
					</Button>
				</div>
			</div>
		{/each}
		<div class="px-6 py-4">
			<Button variant="outline" class="h-7 w-80 bg-white p-4" on:click={addContent}>
				<Plus class="mr-1 w-[1rem] text-slate-700" />
				Add FAQ
			</Button>
		</div>
	</div>
	{#if content.length}
		<Button class="mt-4" on:click={save}>Save</Button>
	{/if}
</AdminScreen>
