<script lang="ts">
	import { page } from '$app/stores'
	import Screen from '$lib/components/Screen.svelte'
	import Button from '$lib/components/ui/button/button.svelte'
	import { getEventContext, getMeContext } from '$lib/state/getContexts'
	import Mail from 'lucide-svelte/icons/mail'
	import MessageCircleMore from 'lucide-svelte/icons/message-circle-more'
	import { ChatBubble } from 'radix-icons-svelte'

	const smsMessage = 'Hi, this is '

	const event = getEventContext()
</script>

<Screen title="Contact" bigTitle="Contact Us">
	<div class="mx-auto max-w-7xl px-6 py-8">
		<div class="text-2xl font-semibold">Need some assistance?</div>
		<div class="text-a-accent mt-3 pb-2 text-lg font-semibold">Our Contact Info</div>
		<div class="flex flex-col gap-2">
			<!-- <Button
				href="sms://+15038521120;?&body={encodeURIComponent(smsMessage)}"
				variant="outline"
				class="flex w-full justify-between px-4 py-8"
			>
				<div class="flex flex-col">
					<div class="text-sm text-slate-600">Send us a text</div>
					<div class="text-sm font-semibold text-slate-800">503-852-1120</div>
				</div>
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
					<MessageCircleMore class="-mt-0.5 ml-0.5 h-6 w-6 text-red-600" />
				</div>
			</Button> -->
			<Button
				href="mailto:{$event.getContent('support-email')}"
				variant="outline"
				class="flex w-full justify-between px-4 py-8"
			>
				<div class="flex flex-col">
					<div class="text-sm text-slate-600">Send us an email</div>
					<div class="text-sm font-semibold text-slate-800">
						{$event.getContent('support-email')}
					</div>
				</div>
				<div class="bg-a-accent/10 flex h-10 w-10 items-center justify-center rounded-full">
					<Mail class="text-a-accent -mt-0.5 h-5 w-5" />
				</div>
			</Button>
		</div>
	</div>
</Screen>
