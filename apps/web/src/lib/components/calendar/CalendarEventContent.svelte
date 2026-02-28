<script lang="ts">
	import type { CalendarEventClient } from '$lib/server/procedures/event'

	import { Avatars } from '@matterloop/ui'
	import { dayjs } from '@matterloop/util'

	export let event: CalendarEventClient
</script>

<div class="flex w-full flex-col border-l-2 border-emerald-500 bg-white px-2 py-1">
	<!-- <p class="text-xxs font-bold text-slate-700">2pm - 3pm</p> -->
	<p class="text-xxs font-bold text-slate-700">
		{dayjs(event.startAt).format('ha')}
		-
		{dayjs(event.endAt).format('ha')}
	</p>
	<p class="truncate text-xs font-bold">{event.title}</p>
	<div class="flex items-center">
		<Avatars
			style=""
			size={1.4}
			users={event.event_users}
			class="ml-2"
			moreTextClass="text-xxs font-bold h-6 pl-2 pr-1.5 rounded-full ring-2 ring-white z-0 flex items-center justify-center bg-slate text-gray-800"
		/>
	</div>
</div>
