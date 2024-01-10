<script lang="ts">
import { Avatar, HeroIcon } from '@matterloop/ui'
import { dayjs } from '@matterloop/util'
import { isMobile } from '$lib/core/stores'
import type { CalendarEventClient } from '$lib/server/procedures/event'
import { getMeContext } from '$lib/state/getContexts'
import { trpc } from '$lib/trpc/client'
import { createEventDispatcher } from 'svelte'
import { X } from 'svelte-hero-icons'

let className = ''

export { className as class }
export let event: CalendarEventClient | null

let submitting = false
const me = getMeContext()
const dispatch = createEventDispatcher()
$: isAttended = event?.event_users.some((user) => user.userId === $me.id)
$: event_owner = event?.event_users?.find((user) => user.role === 'owner')

const handleAttend = async () => {
	if (!event) {
		return
	}
	submitting = true
	try {
		const rsp = await trpc().event.toggleEventSignUp.mutate({ eventId: event.id })
	} catch (error) {
		console.log(error)
	}
	dispatch('refresh')
	submitting = false
}
</script>

{#if event}
	{@const { title, description, startAt, endAt, event_users } = event}
	<div
		class={`${className} flex-start absolute bottom-0 right-0 top-0 z-10 flex flex-col border-gray-500 bg-white`}
		class:border-2={!$isMobile}
	>
		<div class="flex justify-between px-8 py-6">
			<h1 class="text-lg font-bold">{title}</h1>
			{#if !$isMobile}
				<button on:click={() => (event = null)}>
					<HeroIcon src={X} class="w-6" />
				</button>
			{/if}
		</div>
		<div
			class={`flex border-y-2 border-gray-500 py-2 ${
				$isMobile ? 'mx-auto w-80 flex-col items-center gap-2 rounded-xl border-x-2' : ''
			}`}
		>
			<div class="flex items-end px-8 font-bold uppercase">
				<div>
					<p class="text-xxs mb-0.5 text-slate-700">starts at</p>
					<p class="mt-2">{dayjs(startAt).format('ha')}</p>
				</div>
				<span class="mx-2">-</span>
				<div class="text-right">
					<p class="text-xxs mb-0.5 text-slate-700">goes to</p>
					<p class="mt-2">{dayjs(endAt).format('ha')}</p>
				</div>
			</div>
			<div
				class={`border-gray-500 px-8 font-bold ${
					$isMobile ? 'flex w-full flex-col items-center border-y-2 py-2' : 'border-x-2'
				}`}
			>
				<p class="text-xxs uppercase text-slate-700">hosted by</p>
				<div class="mt-0.5 flex items-center leading-3">
					<Avatar
						size="2"
						user={{ ...event_owner, ...(event_owner ? { id: event_owner.userId } : {}) }}
					/>
					<div class="text-xxs ml-2">
						<p>{event_owner?.firstName ?? 'No user'}</p>
						<p>{event_owner?.lastName ?? ''}</p>
					</div>
				</div>
			</div>
			<div class={`flex flex-1 items-center px-8 ${$isMobile ? 'gap-2 py-2' : ''}`}>
				<div class="text-center font-bold leading-4">
					<p>{event_users.length}</p>
					<p class="text-xxs">Attending</p>
				</div>
				<button
					class="bg-gray ml-auto rounded-lg px-3 py-2 text-sm text-gray-800"
					class:opacity-50={isAttended}
					disabled={isAttended}
					on:click={handleAttend}
				>
					Attend Event
				</button>
			</div>
		</div>
		<div class="p-8 text-base text-gray-800">
			{description}
		</div>
		<div class="bg-gray m-2 mt-auto rounded-lg p-4">
			<button
				class="button-primary close ml-20"
				class:opacity-50={isAttended}
				disabled={isAttended}
				on:click={handleAttend}
			>
				Attend this Event
			</button>
		</div>
	</div>
{/if}

<style lang="postcss">
.close {
	@apply mx-auto w-80;
}
</style>
