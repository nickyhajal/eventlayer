<script lang="ts">
import UserForm from '../UserForm.svelte'

export let data
</script>

<div class="grid grid-cols-[20rem_1fr] px-4">
	<div>
		<UserForm user={data.user} titleClass="text-2xl font-semibold" />
	</div>
</div>
