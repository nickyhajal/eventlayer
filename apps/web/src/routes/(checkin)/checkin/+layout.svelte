<script lang="ts">
	import '../../../app.postcss'

	import { browser } from '$app/environment'
	import { page } from '$app/stores'
	import { eventWritable } from '$lib/client/models/eventWritable'
	// import RequestNotificationPermission from '$lib/components/RequestNotificationPermission.svelte'
	import Confirmations from '$lib/components/Confirmations.svelte'
	import { Toaster } from '$lib/components/ui/sonner'
	import { loadAttendeeStore } from '$lib/util/loadAttendeeSearch'
	import { onMount, setContext } from 'svelte'
	import { persisted } from 'svelte-persisted-store'
	import { writable, type Writable } from 'svelte/store'

	import type { AttendeeStore } from '@matterloop/db'
	import { dayjs, getMediaUrl } from '@matterloop/util'

	export let data
	let mounted = false
	let notificationRequestOpen = false
	type MeType = typeof $page.data.me
	let me: Writable<MeType> | undefined

	// if (typeof window !== 'undefined') {
	//   updateDevice(window.innerWidth)
	// }
	// $: if ($navigating) {
	//   mixpanel.track_pageview()
	// }
	$: (setMe(), $page.data.me)

	setContext('event', eventWritable(data.event))
	onMount(async () => {
		mounted = true
	})
	function setMe() {
		type MeType = typeof $page.data.me
		let meFromServer: MeType | undefined = $page.data.me ? { ...$page.data.me } : undefined
		if (!me) {
			me = writable<MeType>(meFromServer)
			setContext('me', me)
		} else if (meFromServer) {
			me.set(meFromServer)
		}
	}
	const attendeeStore = persisted<AttendeeStore>('attendees', {
		attendees: [],
		num: 0,
		hash: 'a',
		lastUpdate: dayjs().subtract(10, 'm').toISOString(),
	})
	let attendeeSearcher: Writable<{
		store: Writable<AttendeeStore>
		query: Awaited<ReturnType<typeof loadAttendeeStore>> | (() => void)
	}> = writable({ store: attendeeStore, query: () => {} })
	if (browser) {
		loadAttendeeStore(attendeeStore).then((searcher) => {
			attendeeSearcher.set({ store: attendeeStore, query: searcher })
		})
	}
	setContext('attendeeSearcher', attendeeSearcher)
</script>

<svelte:head>
	<title>Checkin - Eventlayer</title>
	<link rel="icon" href={data.event.favicon ? getMediaUrl(data.event.favicon) : '/favicon.png'} />
</svelte:head>
<!-- {#if $page.url.pathname.includes('/') && notificationRequestOpen && $me?.community?.isOnboarded}
      <RequestNotificationPermission notificationWorker={NotificationWorker} />
    {/if} -->

<!-- <div class="grid min-h-screen bg-slate-200/60 text-black">
	<div class="flex flex-col">
		<TopNav />
	</div>
</div> -->
<div class="sheets" />
<slot />
<Toaster toastOptions={{ position: 'bottom-center' }} />

<div class="portals" />
<div class="sheets" />
