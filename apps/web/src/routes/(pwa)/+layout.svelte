<script lang="ts">
	import '../../app.postcss'

	import { navigating, page } from '$app/stores'
	// import RequestNotificationPermission from '$lib/components/RequestNotificationPermission.svelte'
	import Confirmations from '$lib/components/Confirmations.svelte'
	import NProgress from 'nprogress'
	import { onMount, setContext } from 'svelte'
	import { Toaster } from 'svelte-french-toast'
	import { persisted } from 'svelte-persisted-store'
	import { writable, type Writable } from 'svelte/store'

	import 'nprogress/nprogress.css'

	import { browser } from '$app/environment'
	import { eventWritable } from '$lib/client/models/eventWritable'
	import type { AttendeeStore } from '$lib/types'
	import { loadAttendeeStore } from '$lib/util/loadAttendeeSearch'

	import { dayjs, getMediaUrl } from '@matterloop/util'

	import EventAppLayout from './EventAppLayout.svelte'

	// import { initOpenReplay } from '$lib/openreplay'
	// import { initWorkers, NotificationWorker } from '$lib/ServiceWorkerController'
	export let data
	let mounted = false
	let notificationRequestOpen = false
	let nprogTimo = 0
	type MeType = typeof $page.data.me
	let me: Writable<MeType> | undefined
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

	// if (typeof window !== 'undefined') {
	//   updateDevice(window.innerWidth)
	// }
	// $: if ($navigating) {
	//   mixpanel.track_pageview()
	// }
	setContext('attendeeSearcher', attendeeSearcher)
	setContext('seed', +new Date() / 1000)
	let eventContextSet = false
	const event = eventWritable(data.event)
	$: if (data.event) {
		if (!eventContextSet) {
			setContext('event', event)
			eventContextSet = true
		} else {
			event.set(data.event)
		}
	}

	$: setMe(), $page.data.me
	let nprogressReady = false
	const tabbar = typeof document !== 'undefined' ? document?.getElementById('tabbar') : null
	if (tabbar) {
		NProgress.configure({
			// Full list: https://github.com/rstacruz/nprogress#configuration
			showSpinner: false,
			parent: '#tabbar',
			minimum: 0.16,
		})
		nprogressReady = true
	}

	$: {
		if (nprogressReady) {
			if ($navigating) {
				nprogTimo = setTimeout(() => {
					NProgress.start()
				}, 200)
			}
			if (!$navigating) {
				clearTimeout(nprogTimo)
				NProgress.done()
			}
		}
	}

	onMount(async () => {
		mounted = true
		const setVh = () => {
			const vh = typeof window !== 'undefined' ? window.innerHeight * 0.01 : 0
			document.documentElement.style.setProperty('--vh', `${vh}px`)
			// updateDevice(window.innerWidth);
		}
		function setVw() {
			let vw = document.documentElement.clientWidth / 100
			document.documentElement.style.setProperty('--vw', `${vw}px`)
		}
		setVh()
		setVw()
		window.addEventListener('resize', setVh)
		window.addEventListener('resize', setVw)
		// syncNotificationWorkerUserId();
		try {
			if (
				window?.navigator?.serviceWorker &&
				window?.Notification.permission === 'default' &&
				!window.localStorage.getItem('notificationsDenied')
			) {
				notificationRequestOpen = true
			}
		} catch (e) {}
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
	// function syncNotificationWorkerUserId() {
	// 	if (!NotificationWorker || !$me?.id) return;
	// 	NotificationWorker.postMessage({
	// 		action: 'setUserId',
	// 		deviceId:
	// 			window.localStorage.getItem('arena_did') ||
	// 			(() => {
	// 				var id = v4();
	// 				window.localStorage.setItem('arena_did', id);
	// 				return id;
	// 			})(),
	// 		userId: $me.id
	// 	});
	// }
	// if ($me && $me.id) {
	// 	syncNotificationWorkerUserId();
	// }
</script>

<svelte:head>
	<title>{data.event?.name}</title>
	<link rel="icon" href={data.event?.favicon ? getMediaUrl(data.event?.favicon) : '/favicon.png'} />
	{#if data.event?.settings?.header_scripts}
		{@html data.event?.settings?.header_scripts}
	{/if}
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
{#if data.event}
	<EventAppLayout>
		<slot />
	</EventAppLayout>
{:else}
	<div class="py-40 text-center">
		<div class="text-4xl font-semibold">Your events, running smoothly.</div>
		<div class="mx-auto w-96 pt-6 text-xl font-medium">
			EventLayer is a full-service digital platform for running your next big event.
		</div>
	</div>
{/if}
<Toaster toastOptions={{ position: 'bottom-center' }} />
<Confirmations />

<div class="portals" />
<div class="sheets" />
