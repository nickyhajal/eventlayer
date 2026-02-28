<script lang="ts">
	import { tw } from '@matterloop/ui'

	export let title = ''
</script>

<div>
	{#if title}
		<div
			class="flex items-center justify-between border-b border-slate-200/50 px-10 pb-5 pt-[1.15rem]"
		>
			{#if typeof title === 'string'}
				<div class={tw(`mt-0 text-2xl font-semibold`)}>{title}</div>
			{/if}
			<slot name="title" />
		</div>
	{/if}
	<div class="px-10 py-6"><slot /></div>
</div>
