<script lang="ts">
import LoginForm from '$lib/components/LoginForm.svelte'
import Screen from '$lib/components/Screen.svelte'
import { getEventContext } from '$lib/state/getContexts'
</script>

<Screen title="" back="/" noBgScreen={true}>
	<div
		class="wrap pt-safe fixed left-0 top-10 mx-auto mt-24 min-h-screen w-screen bg-white p-4 lg:top-0 lg:mt-40"
	>
		<div class="mx-auto w-full max-w-md">
			<LoginForm />
		</div>
	</div>
</Screen>
