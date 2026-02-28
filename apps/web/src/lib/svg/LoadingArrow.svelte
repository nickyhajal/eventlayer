<div class="arrow bg-brightgreen-800 relative mx-auto mt-20 h-28 w-72 overflow-hidden">
	<div class="stripes absolute left-0 top-0 h-full w-full" />
	<div class="animate-panX-7 flex h-full w-[200rem] opacity-90">
		<div
			class="to-brightgreen-800 h-full w-[100rem] bg-gradient-to-r from-transparent via-emerald-200"
		/>
		<div
			class="from-brightgreen-800 h-full w-[100rem] bg-gradient-to-r via-emerald-200 to-transparent"
		/>
	</div>
</div>

<style>
	.arrow {
		clip-path: polygon(
			calc(100% - 1.4rem) 0,
			100% 50%,
			calc(100% - 1.4rem) 100%,
			0 100%,
			1.4rem 50%,
			0 0
		);
	}
	.stripes {
		z-index: 5;
		opacity: 0.11;
		background-attachment: fixed;
		background: repeating-linear-gradient(
			-50deg,
			transparent,
			transparent 11px,
			#fff 11px,
			#fff 24px
		);
	}
	.arrow > div {
		transform-origin: 100% 100%;
	}
</style>
