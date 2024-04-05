<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Textarea } from '$lib/components/ui/textarea'
import { trpc } from '$lib/trpc/client.js'
import Plus from 'lucide-svelte/icons/plus'
import { toast } from 'svelte-sonner'

import type { Content } from '@matterloop/db'
import { groupBy } from '@matterloop/util'

import AdminScreen from '../AdminScreen.svelte'
import MenuList from './MenuList.svelte'

export let data

let content = data.content
let lastContent = content.map((c) => JSON.stringify(c))

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
const menusByGroup = groupBy(data.event?.menus, 'location')
</script>

<AdminScreen title={true}>
	<div class="flex items-center gap-3" slot="title">
		<div class="text-2xl font-semibold">Menus</div>
	</div>

	<div class="flex flex-col gap-3">
		<div class="rounded-xl bg-stone-200/50 p-2">
			<div class="px-3 pb-2 pt-2 text-base font-semibold text-stone-700">Desktop</div>
			<div class="mb-2 rounded-xl bg-stone-50">
				<div class="mb-0.5 px-3 pb-2 pt-3 text-sm font-semibold text-stone-800/70">Top Sidebar</div>
				<MenuList items={menusByGroup['top-sidebar']} />
			</div>
			<div class="rounded-xl bg-stone-50">
				<div class="mb-0.5 px-3 pb-2 pt-3 text-sm font-semibold text-stone-800/70">
					Bottom Sidebar
				</div>
				<MenuList items={menusByGroup['bot-sidebar']} />
			</div>
		</div>
		<div class="rounded-xl bg-stone-200/50 p-2">
			<div class="px-3 pb-2 pt-2 text-base font-semibold text-stone-700">Mobile</div>
			<div class="mb-2 rounded-xl bg-stone-50">
				<div class="mb-0.5 px-3 pb-2 pt-3 text-sm font-semibold text-stone-800/70">Tabs</div>
				<MenuList items={menusByGroup['tabs']} />
			</div>
			<div class="rounded-xl bg-stone-50">
				<div class="mb-0.5 px-3 pb-2 pt-3 text-sm font-semibold text-stone-800/70">Menu Page</div>
				<MenuList items={menusByGroup['menu']} />
			</div>
		</div>
		<div class="rounded-xl bg-stone-200/50 p-2">
			<div class="px-3 pb-2 pt-2 text-base font-semibold text-stone-700">Other</div>
			<div class="mb-2 rounded-xl bg-stone-50">
				<div class="mb-0.5 px-3 pb-2 pt-3 text-sm font-semibold text-stone-800/70">Quick Menu</div>
				<MenuList items={menusByGroup['quick']} />
			</div>
		</div>
	</div>
</AdminScreen>
