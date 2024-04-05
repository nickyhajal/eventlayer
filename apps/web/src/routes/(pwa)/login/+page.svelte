<script lang="ts">
import LoginForm from '$lib/components/LoginForm.svelte'
import Screen from '$lib/components/Screen.svelte'
import { getEventContext } from '$lib/state/getContexts'
</script>

<Screen title="" back="/" noBgScreen={true}>
	<div class="wrap mx-auto mt-40 min-h-screen max-w-md bg-white p-4">
		<LoginForm />
	</div>
</Screen>
