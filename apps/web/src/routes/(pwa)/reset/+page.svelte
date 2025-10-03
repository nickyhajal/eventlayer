<script lang="ts">
	import { browser } from '$app/environment'

	if (browser) {
		navigator?.serviceWorker?.getRegistrations().then((registrations) => {
			for (const registration of registrations) {
				alert('Unregistered service worker')
				console.log('unregistering', registration)
				registration.unregister()
			}
		})
	}
	window.location.pathname = '/'
	location.href = '/'
</script>

<div></div>
