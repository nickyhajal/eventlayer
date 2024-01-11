<script lang="ts">
import { invalidate, invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Dialog from '$lib/components/ui/dialog'
import Plus from 'lucide-svelte/icons/plus'

import { HeroIcon, Input } from '@matterloop/ui'

export let data

let addOpen = false
</script>

<div class="px-4">
	<div class="flex items-center gap-3">
		<div class="text-2xl font-semibold">People</div>
		<Button variant="outline" class="h-7 py-[0.3rem] pl-1.5 pr-3" on:click={() => addOpen = true}>
			<Plus class="mr-1 w-[1rem] text-slate-700" />
			Add Person</Button
		>
	</div>
	{#each data.users || [] as user}
		{user?.firstName}
	{/each}
</div>

<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Add Person</Dialog.Title>
			<Dialog.Description>Add a user</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<!-- <Label for="name" class="text-right">Name</Label> -->
				<!-- <Input id="name" value="Pedro Duarte" class="col-span-3" /> -->
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<!-- <Label for="username" class="text-right">Username</Label>
        <Input id="username" value="@peduarte" class="col-span-3" /> -->
			</div>
		</div>
		<Dialog.Footer>
			<Button type="submit">Save changes</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
