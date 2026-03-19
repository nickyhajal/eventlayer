<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { onMount } from 'svelte'
	import Ably from 'ably'

	import { dayjs, getMediaUrl } from '@matterloop/util'

	export let data

	$: showBanner = data.effective.notificationEnabled && data.effective.notificationMessage
	$: isTopBanner = data.effective.notificationPosition !== 'bottom'

	function getCardImage(event: any) {
		const media = event?.photo ?? event?.venue?.photo
		return media ? getMediaUrl(media) : ''
	}

	onMount(() => {
		let refreshing = false
		const client = new Ably.Realtime({
			authUrl: '/ably/token',
		})
		const channel = client.channels.get(data.screensChannel)
		const dataListener = async () => {
			if (refreshing) return
			refreshing = true
			try {
				await invalidateAll()
			} finally {
				refreshing = false
			}
		}
		const hardRefreshListener = () => {
			window.location.reload()
		}
		channel.subscribe('screens-updated', dataListener)
		channel.subscribe('screen-hard-refresh', hardRefreshListener)
		return () => {
			channel.unsubscribe('screens-updated', dataListener)
			channel.unsubscribe('screen-hard-refresh', hardRefreshListener)
			client.close()
		}
	})
</script>

<svelte:head>
	<title>{data.event.name} | Screen {data.screen.key}</title>
</svelte:head>

<main class="min-h-screen bg-slate-950 text-slate-100">
	{#if showBanner && isTopBanner}
		<div class="border-b border-amber-300/40 bg-amber-200 px-6 py-4 text-center text-2xl font-semibold text-amber-900">
			{data.effective.notificationMessage}
		</div>
	{/if}

	{#if data.effective.mode === 'message'}
		<div class="flex min-h-[calc(100vh-2rem)] items-center justify-center px-10 py-10">
			<div class="max-w-6xl text-center text-6xl font-semibold leading-tight lg:text-8xl">
				{data.effective.messageBody || 'Welcome'}
			</div>
		</div>
	{:else}
		<div class="px-8 py-8">
			<div class="mb-8 text-center">
				<div class="text-5xl font-semibold tracking-tight">{data.event.name}</div>
				<div class="mt-2 text-xl text-slate-300">Upcoming Events</div>
			</div>

			{#if data.upcoming?.length}
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{#each data.upcoming as event}
						<div class="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
							{#if getCardImage(event)}
								<img
									alt={event.name}
									src={getCardImage(event)}
									class="h-56 w-full object-cover"
								/>
							{/if}
							<div class="space-y-2 p-5">
								<div class="text-3xl font-semibold leading-tight">{event.name}</div>
								<div class="text-lg text-slate-300">
									{event.venue?.name || 'TBA'}
								</div>
								<div class="text-lg text-slate-200">
									{dayjs(event.startsAt).format('MMM D, h:mma')}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-2xl border border-slate-700 bg-slate-900 p-12 text-center text-3xl text-slate-300">
					No upcoming events to display.
				</div>
			{/if}
		</div>
	{/if}

	{#if showBanner && !isTopBanner}
		<div class="border-t border-amber-300/40 bg-amber-200 px-6 py-4 text-center text-2xl font-semibold text-amber-900">
			{data.effective.notificationMessage}
		</div>
	{/if}
</main>
