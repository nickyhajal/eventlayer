<script lang="ts">
import * as Select from '$lib/components/ui/select'

interface Option {
	label: string
	value: string
}

export let value = ''
export let name = ''
export let label = ''
export let placeholder = ''
export let options: Option[] = []
let selectedOption = options.find((o) => o.value === value) ?? options[0]
$: value = selectedOption?.value || ''
</script>

<Select.Root bind:selected={selectedOption}>
	<Select.Trigger class="w-[200px] bg-white">
		<Select.Value placeholder={placeholder ? placeholder : `Select ${label}`} />
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.Label>{label}</Select.Label>
			{#each options as { label, value }}
				<Select.Item value={value} label={label}>{label}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
	{#if name}
		<Select.Input name={name} />
	{/if}
</Select.Root>
