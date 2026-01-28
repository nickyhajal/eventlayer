<script lang="ts">
	import { onMount } from 'svelte'
	import { api } from 'sveltekit-api-fetch'

	import { Button, HeroIcon, Input, Select } from '@matterloop/ui'
	import { dispatch } from '@matterloop/util'

	export let value = ''
	export let allowCreate = false
	export let placeholder = 'Search Users'
	export let name = ''
	export let query = {}
	export let filterValues: string[] = []
	export let useItems = false
	let filterText = ''
	let options: { label: string; value: string }[] | undefined

	onMount(async () => {
		if (useItems) {
			options = await search('')
		}
	})
	$: options =
		useItems && options ? options.filter(({ value }) => !filterValues.includes(value)) : undefined
	async function search(q: string) {
		const rsp = await api.POST('/api/users', { body: { q, ...query } })
		const json = await rsp.json()
		const final = json.map(({ firstName, lastName, id }) => ({
			label: `${firstName} ${lastName}`,
			value: id,
		}))
		return final
	}
</script>

<Input
	{name}
	type="select"
	selectProps={!useItems ? { loadOptions: search } : {}}
	bind:value
	{options}
	{placeholder}
	on:select
	bind:filterText
>
	<div slot="empty">
		{#if filterText?.length > 2 && allowCreate}
			<div class="w-full rounded-2xl bg-white p-4">
				<div class="w-full py-6 text-center text-sm text-slate-500">
					Create new user: <b>{filterText}</b>
				</div>
				<Button
					on:click={() => $dispatch('create', filterText)}
					class="block h-10 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[0.85rem] font-medium text-emerald-600/70 shadow-[0px_2px_3px_rgba(0,0,0,0.04)]"
					>Create User</Button
				>
			</div>
		{/if}
	</div>
</Input>
