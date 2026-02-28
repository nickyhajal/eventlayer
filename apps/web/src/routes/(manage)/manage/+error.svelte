<script>
	import { ExclamationTriangle } from '@steeze-ui/heroicons'
	import { page } from '$app/stores'

	import { HeroIcon } from '@matterloop/ui'
</script>

{#if $page.error}
	<div class="m-8 max-w-4xl border-2 border-yellow-500/10 bg-yellow-50 text-slate-700">
		<div
			class="flex items-center gap-3 border-b border-yellow-500/20 bg-white/60 px-12 py-6 text-base font-semibold text-yellow-600/90"
		>
			<HeroIcon src={ExclamationTriangle} class="mt-1 h-6 w-6 text-yellow-500/70" theme="solid" /> There
			was an issue
		</div>
		<div class="ml-1.5 px-20 py-12">
			<div class="text-lg font-semibold text-slate-600">
				{$page.error.message}
			</div>
			<div class="w-9/12 pt-1 text-sm font-medium text-slate-500">
				Our team has been notified of this error. Contact support@eventlayer.co if you need
				assistance.
			</div>
		</div>
	</div>
{/if}
