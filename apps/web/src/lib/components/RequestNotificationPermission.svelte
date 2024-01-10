<script lang="ts">
import { Button, HeroIcon } from '@matterloop/ui'
import { InformationCircle } from '@steeze-ui/heroicons'
import type { NotificationWorker } from '$lib/ServiceWorkerController'

export let notificationRequestOpen = true
export let notificationWorker: typeof NotificationWorker | undefined

let containerOpen = false

async function handleRequestPermission() {
	try {
		const permission = await window.Notification.requestPermission()
		if (permission === 'granted' && notificationWorker) {
			notificationWorker.postMessage({ action: 'subscribe' })
		}
	} catch (e) {
		console.error(e)
	}
}
function handleNoThanksToNotifications() {
	window.localStorage.setItem('notificationsDenied', '1')
	notificationRequestOpen = false
	containerOpen = false
}
$: {
	if (notificationRequestOpen) {
		setTimeout(() => {
			containerOpen = true
		}, 100)
	}
}
</script>

<div
	class={`duration-400 flex items-center justify-center overflow-hidden border-gray-700/90 bg-yellow-50/40 px-2 transition-all ${
		containerOpen ? 'h-[6rem] border-b-4 opacity-100' : 'h-[0px] border-b-0 opacity-0'
	}`}
>
	<HeroIcon src={InformationCircle} class="mr-4 mt-0.5 h-8 w-8 text-orange-500/30" />
	<div class="mr-24 rounded-xl pb-2.5 pt-3 text-base font-semibold text-orange-900/70">
		Turn on notifications to get the most out of Arena
	</div>
	<Button
		on:click={() => handleRequestPermission()}
		class="shadow-line h-10 w-60 border border-gray-600/60 bg-white p-0 px-0 py-0 text-emerald-600"
		style="white">Ask for Permission</Button
	>
	<Button
		class="ml-0 w-40 font-medium text-gray-800 hover:text-gray-900"
		on:click={() => handleNoThanksToNotifications()}
		style="transparent">No Thanks</Button
	>
</div>
