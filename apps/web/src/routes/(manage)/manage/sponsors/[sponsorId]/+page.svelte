<script lang="ts">
import AdminScreen from '../../AdminScreen.svelte'
import SponsorForm from '../SponsorForm.svelte'

export let data

let loading = false
</script>

<AdminScreen>
	<div class="grid grid-cols-[50rem_1fr] px-4">
		<div>
			<SponsorForm sponsor={data.sponsor} titleClass="text-2xl font-semibold" />
		</div>
	</div>
</AdminScreen>
