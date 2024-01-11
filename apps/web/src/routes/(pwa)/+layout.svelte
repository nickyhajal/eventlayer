<script lang="ts">
import '../../app.postcss'

import { page } from '$app/stores'
// import RequestNotificationPermission from '$lib/components/RequestNotificationPermission.svelte'
import Confirmations from '$lib/components/Confirmations.svelte'
import { onMount, setContext } from 'svelte'
import { Toaster } from 'svelte-french-toast'
import { writable, type Writable } from 'svelte/store'

import EventAppLayout from './EventAppLayout.svelte'

// import { initOpenReplay } from '$lib/openreplay'
// import { initWorkers, NotificationWorker } from '$lib/ServiceWorkerController'
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
$: setMe(), $page.data.me

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
	<title>Eventlayer</title>
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
	Marketing site
{/if}
<Toaster toastOptions={{ position: 'bottom-center' }} />
<Confirmations />

<div class="portals" />
<div class="sheets" />
