<script lang="ts">
import { Button } from '$lib/components/ui/button'
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
	content = [...content, { title: '', body: '', type: 'faq', ord: content.length }]
}
async function save() {
	const toSave: Content[] = []
	content.forEach((c, i) => {
		if (JSON.stringify(c) !== lastContent[i]) {
			toSave.push(c)
		}
	})
	await Promise.all(toSave.map((c) => trpc().content.upsert.mutate(c)))
	toast.success('Saved FAQs')
}
</script>

<AdminScreen>
	<div class="">
		<div class="flex items-center gap-3">
			<div class="text-2xl font-semibold">FAQs</div>
		</div>

		<div class="mt-4 flex w-6/12 min-w-[42rem] flex-col rounded-lg bg-stone-100">
			{#each content as { id, title, body }, i}
				<div class="grid grid-cols-2 gap-2 divide-x px-6 py-2 odd:bg-stone-200/40">
					<div class="text-base font-medium">
						<Textarea
							bind:value={content[i].title}
							class="w-full bg-white"
							placeholder="Question"
						/>
					</div>
					<div class="text-base font-medium">
						<Textarea bind:value={content[i].body} class="w-full bg-white" placeholder="Body" />
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
	</div>
</AdminScreen>
