<script lang="ts">
import { DateFormatter, getLocalTimeZone, parseDate, type DateValue } from '@internationalized/date'
import { Button } from '$lib/components/ui/button'
import { Calendar } from '$lib/components/ui/calendar'
import * as Popover from '$lib/components/ui/popover'
import { cn } from '$lib/utils'
import { Calendar as CalendarIcon } from 'radix-icons-svelte'

import { dayjs } from '@matterloop/util'

export let valueStr = ''
const df = new DateFormatter('en-US', {
	dateStyle: 'long',
})
let value: DateValue | undefined = valueStr ? parseDate(valueStr) : undefined
$: valueStr = value ? dayjs(value?.toDate()).format('YYYY-MM-DD') : ''
</script>

<Popover.Root>
	<Popover.Trigger asChild let:builder>
		<Button
			variant="outline"
			class={cn(
        "w-[240px] justify-start text-left font-normal",
        !value && "text-muted-foreground"
      )}
			builders={[builder]}
		>
			<CalendarIcon class="mr-2 h-4 w-4" />
			{value ? df.format(value.toDate(getLocalTimeZone())) : "Pick a date"}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" align="start">
		<Calendar bind:value={value} />
	</Popover.Content>
</Popover.Root>
