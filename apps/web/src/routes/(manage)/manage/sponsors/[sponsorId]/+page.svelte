<script lang="ts">
	import { Button } from '$lib/components/ui/button'
	import AdminScreen from '../../AdminScreen.svelte'
	import SponsorForm from '../SponsorForm.svelte'
	import SponsorLeadTable from '../SponsorLeadTable.svelte'

	export let data

	let loading = false

	function selectUrl(event: Event) {
		const target = event.currentTarget as HTMLInputElement
		target.select()
	}
</script>

<AdminScreen>
	<div class="max-w-[50rem] px-4">
		<SponsorForm sponsor={data.sponsor} titleClass="text-2xl font-semibold">
			<div slot="right-bottom" class="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5">
				<div class="text-lg font-semibold text-stone-800">Sponsor QR Code</div>
				<p class="mt-2 text-sm leading-6 text-stone-600">
					Print this code at the booth so attendees can open the sponsor landing page and heart the
					business in one step.
				</p>

				<div class="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white p-3">
					<img src={data.qrcode} alt={`QR code for ${data.sponsor.title}`} class="w-full" />
				</div>

				<div class="mt-5 pb-2 text-sm font-semibold text-stone-700">Public Sponsor URL</div>
				<input
					type="text"
					readonly
					value={data.publicUrl}
					class="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-600"
					on:focus={selectUrl}
					on:click={selectUrl}
				/>

				<div class="mt-4 flex flex-col gap-2">
					<Button
						variant="outline"
						class="justify-center"
						href={`/sponsor-print/${data.sponsor.id}`}
						target="_blank"
						rel="noreferrer"
					>
						Print QR Page
					</Button>
					<Button
						href={data.publicUrl}
						target="_blank"
						rel="noreferrer"
						class="justify-center bg-sky-700 text-white hover:bg-sky-600"
					>
						Open Sponsor Landing Page
					</Button>
				</div>
			</div>
		</SponsorForm>

		<div class="mt-10">
			<div class="mb-3 text-xl font-semibold">Hearted Attendees</div>
			<SponsorLeadTable rows={data.leads} />
		</div>
	</div>
</AdminScreen>
