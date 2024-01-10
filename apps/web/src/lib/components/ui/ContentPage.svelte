<script lang="ts">
import { Button, HeroIcon, tw } from '@matterloop/ui'
import { ChevronLeft } from '@steeze-ui/heroicons'

interface Button {
	label: string
	href?: string
	to?: string
	handleClick?: (e?: MouseEvent) => void
}
export let title = ''
export let button: Button | false = false
export let hasBodyHeader = true
export let bodyClass = 'px-8 py-10'
</script>

<div>
	<div>
		<div class="grid overflow-hidden" class:grid-rows-[3.7rem_1fr]={hasBodyHeader}>
			{#if hasBodyHeader}
				<div
					class="flex w-full border-b border-slate-200 py-4 text-left text-xl font-semibold text-slate-900"
				>
					<div class="px-0">
						<HeroIcon src={ChevronLeft} class="w-5 opacity-0" />
					</div>
					<div class="flex w-full items-center justify-between gap-5 pr-4">
						<div class="font-semibold text-slate-600">{title || ''}</div>
						<div class="">
							{#if button}
								<Button
									to={button.href || button.to}
									on:click={button.handleClick}
									class="ml-auto block h-8 rounded-md border border-b-2 border-slate-200 bg-white px-4 pt-0 text-[0.85rem] font-medium text-emerald-600/70 shadow-[0px_2px_3px_rgba(0,0,0,0.04)] transition-all hover:bg-emerald-50/30"
									>{button.label}</Button
								>
							{/if}
						</div>
					</div>
				</div>
			{/if}
			<div class={tw(`grow px-8 py-10 ${bodyClass}`)}>
				<slot />
			</div>
		</div>
	</div>
</div>
