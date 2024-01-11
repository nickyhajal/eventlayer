<script lang="ts">
export let title = ''
</script>

<div class="grid grid-rows-[2rem_1fr]">
	<div class="flex w-full items-center justify-center bg-slate-800">
		<div class="text-sm font-semibold text-white">{title}</div>
	</div>
	<div class=""><slot /></div>
</div>
