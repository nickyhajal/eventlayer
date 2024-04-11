<script lang="ts">
import { invalidateAll } from '$app/navigation'
import ChicletButton from '$lib/components/ui/ChicletButton.svelte'
import { trpc } from '$lib/trpc/client'

import AdminScreen from '../../AdminScreen.svelte'
import UserForm from '../UserForm.svelte'

export let data
const fullName = `${data.user.firstName} ${data.user.lastName}`
let confirmingSend = false
$: onboardStatus = data.user.onboardStatus

async function sendWelcomeEmail() {
	if (!confirmingSend) {
		confirmingSend = true
		setTimeout(() => {
			confirmingSend = false
		}, 700)
	} else if (confirmingSend) {
		await trpc().user.sendWelcomeEmail.mutate({ userId: data.user.userId })
		invalidateAll()
	}
}
async function getLinkedInData() {
	const res = await trpc().user.syncLinkedInData.mutate({ userId: data.user.userId })
	console.log('res', res)
	invalidateAll()
}
</script>

<AdminScreen title={fullName}>
	<div slot="title">
		{#if onboardStatus !== 'done'}
			<div class="f flexitems-end gap-1">
				<ChicletButton on:click={() => sendWelcomeEmail()}>
					<span class="pl-1 pr-2 text-xs">👋</span>
					{#if confirmingSend}
						<span>Click Again to Send</span>
					{:else if onboardStatus === 'not-sent'}
						<span>Send Welcome Email</span>
					{:else if onboardStatus === 'pending'}
						<span>Send Welcome Email Again</span>
					{/if}
				</ChicletButton>
				<ChicletButton on:click={() => getLinkedInData()}>
					<span class="pl-1 pr-2 text-xs">🔽</span>
					<span> Sync LinkedIn Data</span>
				</ChicletButton>
			</div>
		{/if}
	</div>
	<div>
		<div class="grid grid-cols-[20rem_1fr] gap-8">
			<div>
				<UserForm user={data.user} titleClass="text-2xl font-semibold" showTitle={false} />
			</div>
			<div>
				<label class="block pb-2.5 pt-3.5 text-sm font-semibold">Profile QR Code</label>
				<div class="h-[10rem] w-[10.1rem] overflow-hidden rounded-md border border-slate-300 p-0">
					<img src={data.qrcode} class="w-[10rem]" />
				</div>
			</div>
		</div>
	</div></AdminScreen
>
