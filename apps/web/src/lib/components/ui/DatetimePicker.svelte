<script lang="ts">
import { DateFormatter, getLocalTimeZone, type DateValue } from '@internationalized/date'
import Datepicker from '$lib/components/ui/Datepicker.svelte'
import { Input } from '$lib/components/ui/input'
import Label from '$lib/components/ui/label/label.svelte'
import { onMount } from 'svelte'

import { dayjs } from '@matterloop/util'

export let defaultDate = ''
export let defaultTime = '09:00'
export let date = defaultDate
export let time = defaultTime
export let value: string | null | undefined = null
export let label = 'Start'
if (value) {
	const bits = value.split(' ')
	date = bits[0]
	time = bits[1]
}
$: value = date && time ? `${date} ${time}` : null
</script>

<div class="flex gap-4">
	<div class="flex flex-col items-start justify-center gap-1">
		<Label for="date" class="text-right">{label} Date</Label>
		<Datepicker bind:valueStr={date} />
	</div>
	<div class="flex flex-col items-start justify-center gap-1">
		<Label for="date" class="text-right">{label} Time</Label>
		<Input type="time" bind:value={time} />
	</div>
</div>
