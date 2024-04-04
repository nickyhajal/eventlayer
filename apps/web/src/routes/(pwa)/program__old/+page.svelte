<script lang="ts">
import Screen from '$lib/components/Screen.svelte'
import Button from '$lib/components/ui/button/button.svelte'
import { getEventContext, getMeContext } from '$lib/state/getContexts'

import { getMediaUrl } from '@matterloop/util'

const me = getMeContext()
const event = getEventContext()
</script>

<Screen title="Program" bigTitle="Program">
	<div class="container mx-auto px-6 pt-2 md:max-w-7xl">
		<img
			src={getMediaUrl($event.largeLogo)}
			alt="An alt text"
			class="mx-auto mb-10 mt-0 w-10/12 pb-2 md:w-8/12"
		/>
		<div class="pb-12 text-slate-600">
			<div class="mb-3 text-2xl font-semibold">About the Conference</div>
			<p>
				We are thrilled you are taking part in the inaugural SOS (Save Our Sites) conference,
				created by a group of experienced site owners who deeply understand the industry's
				day-to-day operations and unique challenges. As fellow site owners, we understand the
				difficulties you face on a daily basis and have designed this conference to provide valuable
				insights, solutions, and support.
			</p>
			<p>
				We also feel the same way as you likely do: sometimes it seems as if the entire industry is
				against us, and other stakeholders may have more resources to be heard, while we must settle
				for the status quo. This is no longer acceptable, WE MUST SAVE OUR SITES!
			</p>
		</div>
		<div class="text-slate-600">
			<div class="mb-3 text-2xl font-semibold">Sponsors: SOS Alliance</div>
			<p>
				Every member of the SOS Alliance is chosen by our executive specifically because they are
				working every day to help our sites succeed. Want to know how? Check out our SOS Webinar
				series that explores this exact question:
			</p>
			<Button
				class="bg-a-accent mb-16 mt-6 w-full text-white"
				href="https://saveoursites.com/webinars"
				target="_blank"
			>
				Alliance Webinar Series</Button
			>
		</div>
	</div>
</Screen>
