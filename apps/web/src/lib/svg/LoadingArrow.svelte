<div class="arrow relative mx-auto mt-20 h-28 w-72 overflow-hidden bg-brightgreen-800">
	<div class="stripes absolute top-0 left-0 h-full w-full" />
	<div class="flex h-full w-[200rem] animate-panX-7 opacity-90">
		<div
			class="h-full w-[100rem] bg-gradient-to-r from-transparent via-emerald-200 to-brightgreen-800"
		/>
		<div
			class="h-full w-[100rem] bg-gradient-to-r from-brightgreen-800 via-emerald-200 to-transparent"
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
