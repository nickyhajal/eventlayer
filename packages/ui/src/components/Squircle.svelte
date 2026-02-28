<script lang="ts">
	let className = ''
	export { className as class }
	export let height: number, width: number
	export let exponent = 0,
		resolution = 360,
		factor = 1

	let pathD: string

	var d: string, shiftW, shiftH

	$: {
		const halfWidth = width / 2.0
		const halfHeight = height / 2.0

		const TWO_PI = Math.PI * 2.0

		shiftW = halfWidth * (1 - factor)
		shiftH = halfHeight * (1 - factor)

		// d = 'M ' + halfWidth + ' ' + 0

		// for (let theta = 0.0; theta < TWO_PI + 0.01; theta += TWO_PI / resolution) {
		//   let sineTheta = Math.sin(theta)
		//   let cosineTheta = Math.cos(theta)
		//   let r = Math.pow(
		//     1 /
		//       (Math.pow(Math.abs(cosineTheta) / halfWidth, exponent) +
		//         Math.pow(Math.abs(sineTheta) / halfHeight, exponent)),
		//     1 / exponent,
		//   )
		//   d += ' L ' + (r * cosineTheta + width / 2) + ' ' + (r * sineTheta + height / 2)
		// }

		pathD = `M 0,${height / 2}
    C 0,${shiftW} ${shiftH},0 ${width / 2},0
    S ${width},${shiftH} ${width},${height / 2}
    	${width - shiftW},${height - 0} ${width / 2},${height}
    	0,${height - shiftH} 0,${height / 2}`
	}
</script>

<svg {width} {height} class={className} viewBox="0 0 {width * 1} {height * 1}">
	<!-- <rect x="0" y="0" width="{width}" height="{height}" rx="{radius}" ry="{radius}" /> -->

	<!-- <path stroke="none" {d} /> -->

	<path stroke="none" d={pathD} />
</svg>
