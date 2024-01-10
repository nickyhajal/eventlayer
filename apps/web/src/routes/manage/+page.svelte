<script lang="ts">
import { Button, Input } from '@matterloop/ui'
import { invalidate, invalidateAll } from '$app/navigation'
import { superForm } from 'sveltekit-superforms/client'

export let data

const { form, validate, enhance, message, errors, allErrors, delayed } = superForm(data.form, {
	onResult: (rsp) => {
		if (rsp.result.status === 200) {
			invalidateAll()
		}
	},
})
</script>

<div class="px-4">
	<div class="text-2xl font-semibold">Dashboard</div>
</div>
