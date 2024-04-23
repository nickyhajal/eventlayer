<script lang="ts">
import { browser } from '$app/environment'
import LoginForm from '$lib/components/LoginForm.svelte'
import Screen from '$lib/components/Screen.svelte'
import { getEventContext } from '$lib/state/getContexts'

export let data
console.log('data', data, browser)
if (browser && data.success) {
	console.log('unregister')
	navigator?.serviceWorker?.getRegistrations()?.then((registrations) => {
		for (const registration of registrations) {
			registration.unregister()
		}
	})
	// setTimeout(() => {
	// 	location.href = '/'
	// }, 10)
}
</script>

<Screen title="" back="/">
	Logging in...
	{#if data.error}
		<div class="wrap mx-auto mt-40 max-w-md p-4">That code isn't valid</div>
	{/if}
</Screen>
