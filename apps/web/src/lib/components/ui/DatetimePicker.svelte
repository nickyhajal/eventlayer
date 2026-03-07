<script lang="ts">
import Datepicker from '$lib/components/ui/Datepicker.svelte'
import { Input } from '$lib/components/ui/input'
import Label from '$lib/components/ui/label/label.svelte'
import { beforeUpdate } from 'svelte'

export let defaultDate = ''
export let defaultTime = '09:00'
export let value: string | null | undefined = null
export let label = 'Start'

function formatDateTime(date: string, time: string) {
	if (!date) return null
	return time ? `${date} ${time}` : date
}

function parseDateTime(
	input: string | null | undefined,
	fallbackDate: string,
	fallbackTime: string,
) {
	const normalized = input?.trim()
	if (!normalized) return { date: fallbackDate, time: fallbackTime }

	const [nextDate = fallbackDate, nextTime = fallbackTime] = normalized.split(' ')
	return { date: nextDate, time: nextTime }
}

const initialValue = parseDateTime(value, defaultDate, defaultTime)
let date = initialValue.date
let time = initialValue.time
let lastHydratedValue = value?.trim() || null
let lastDefaultDate = defaultDate
let lastDefaultTime = defaultTime

beforeUpdate(() => {
	const incomingValue = value?.trim() || null
	const currentValue = formatDateTime(date, time)

	if (incomingValue) {
		if (incomingValue !== lastHydratedValue && incomingValue !== currentValue) {
			const next = parseDateTime(incomingValue, defaultDate, defaultTime)
			date = next.date
			time = next.time
		}
	} else {
		const shouldSyncDefault =
			(!date && !time) || (date === lastDefaultDate && time === lastDefaultTime)

		if (shouldSyncDefault && (date !== defaultDate || time !== defaultTime)) {
			date = defaultDate
			time = defaultTime
		}
	}

	lastHydratedValue = incomingValue
	lastDefaultDate = defaultDate
	lastDefaultTime = defaultTime
})

$: value = formatDateTime(date, time)
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
