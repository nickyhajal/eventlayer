<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import * as Command from '$lib/components/ui/command'
	import * as Popover from '$lib/components/ui/popover'
	import { getVenuesContext } from '$lib/state/getContexts'
	import { tick } from 'svelte'

	type VenueOption = {
		value: string
		label: string
	}
	const venues = getVenuesContext()
	const statuses: VenueOption[] = ($venues || []).map(({ id, name }) => ({
		value: id,
		label: name,
	}))
	let open = false
	export let value = ''
	$: selectedStatus = statuses.find((s) => s.value === value) ?? null
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false
		tick().then(() => {
			document.getElementById(triggerId)?.focus()
		})
	}
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline" class="w-full justify-start bg-white">
			{selectedStatus ? selectedStatus.label : '+ Set Event Venue'}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="p-0" align="start">
		<Command.Root>
			<Command.Input placeholder="Search venues..." />
			<Command.List>
				<Command.Empty>No results found.</Command.Empty>
				<Command.Group>
					{#each statuses as status}
						<Command.Item
							value={status.value}
							onSelect={(currentValue) => {
								value = currentValue
								closeAndFocusTrigger(ids.trigger)
							}}
						>
							{status.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
