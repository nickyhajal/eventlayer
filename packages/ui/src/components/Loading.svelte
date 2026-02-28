<script lang="ts">
	let className = ''
	export { className as class }
</script>

<svg
	class={className}
	width="40"
	height="40"
	viewBox="0 0 40 40"
	xmlns="http://www.w3.org/2000/svg"
	stroke="#fff"
>
	<g fill="none" fill-rule="evenodd">
		<g transform="translate(1 1)" stroke-width="4">
			<circle stroke-opacity=".5" cx="20" cy="20" r="16" />
			<path d="M36 20c0-0-0-20-20-16">
				<animateTransform
					attributeName="transform"
					type="rotate"
					from="0 20 20"
					to="360 20 20"
					dur="1s"
					repeatCount="indefinite"
				/>
			</path>
		</g>
	</g>
</svg>
