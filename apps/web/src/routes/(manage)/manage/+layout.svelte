<script lang="ts">
import { invalidate, invalidateAll } from '$app/navigation'
import { page } from '$app/stores'
import { superForm } from 'sveltekit-superforms/client'

import { Button, Input } from '@matterloop/ui'

export let data
$: currPath = $page.url.pathname.replace('/manage', '')
let links = [
	{
		path: '/',
		label: 'Dashboard',
	},
	{
		path: '/people',
		label: 'People',
	},
	{
		path: '/events',
		label: 'Events',
	},
	{
		path: '/venues',
		label: 'Venues',
	},
	{
		path: '/notifications',
		label: 'Notifications',
	},
]
</script>

<div class="grid h-full grid-rows-[6rem_1fr]">
	<div class="bg-whitefont-semibold grid grid-cols-[15rem_1fr] items-center">
		<div class="flex h-full items-center border-r-2 border-stone-100 bg-stone-50 px-4">
			{data.event.name}
		</div>
		<div class="border-b border-stone-100 px-4 pb-3.5">
			<input
				type="text"
				placeholder="Search anything..."
				class="font-xl w-8/12 rounded-xl border border-stone-100 bg-white px-5 py-3 font-medium"
			/>
		</div>
	</div>
	<div class="grid h-full grid-cols-[15em_1fr]">
		<div
			class="flex h-full flex-col gap-0.5 border-r-2 border-stone-100 bg-stone-50 px-2 py-3 text-sm font-medium text-stone-600"
		>
			{#each links as link}
				{@const thisBits = link.path.substr(1).split('/')}
				{@const currBits = currPath.substr(1).split('/')}
				<a
					class="rounded-md px-2 py-2 {thisBits[0] === currBits[0] ? 'bg-stone-200/50 text-stone-600' : 'text-stone-500/80 hover:bg-stone-100'}"
					href="/manage{link.path}">{link.label}</a
				>
			{/each}
		</div>
		<div class="bg-white px-10 py-6"><slot /></div>
	</div>
</div>
