<script lang="ts">
	import { ChevronRight } from '@steeze-ui/heroicons'
	import type { CalendarEventClient } from '$lib/server/procedures/event'
	import { createEventDispatcher } from 'svelte'

	import { Avatars, HeroIcon } from '@matterloop/ui'
	import { dayjs } from '@matterloop/util'

	export let event: CalendarEventClient

	const dispatch = createEventDispatcher()
	const handleClick = () => dispatch('itemClick', event)
</script>

<div class="hover:bg-slate rounded-xl px-3">
	<div class="border-bluegray flex items-center border-b-2 py-2">
		<div
			class="w-20 border-r-2 border-slate-600 px-2 py-1 text-center text-sm font-bold leading-4 text-gray-700"
		>
			<p class="whitespace-nowrap uppercase">{dayjs(event.startAt).format('MMM D')}</p>
			<p class="uppercase">{dayjs(event.startAt).format('hA')}</p>
		</div>
		<div class="flex min-w-0 flex-[1_1_0] flex-col px-2 text-left">
			<p class="text-mdsm overflow-hidden text-ellipsis whitespace-nowrap font-bold">
				{event.title}
			</p>
			<div class="flex items-center">
				<Avatars
					style=""
					size={1.4}
					users={event.event_users}
					class="ml-2"
					moreTextClass="text-xxs font-bold h-6 pl-1.5 pr-1 rounded-full ring-1 ring-white z-0 flex items-center justify-center bg-slate text-gray-800"
				/>
				<span class="text-xxs ml-2 font-semibold">{event.event_users.length} attending</span>
			</div>
		</div>
		<button class="ml-auto mr-2" on:click={handleClick}>
			<HeroIcon src={ChevronRight} class="w-4 font-bold" />
		</button>
	</div>
</div>
