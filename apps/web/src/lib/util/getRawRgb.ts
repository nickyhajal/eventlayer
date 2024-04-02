export function getRawRgb(str: string) {
	if (str.startsWith('rgb')) {
		return str.replace('rgb(', '').replace('rgba(', '').replace(')', '')
	} else if (str.startsWith('#')) {
		return hexToRGB(str)
	}
}
function hexToRGB(h) {
	let r = 0,
		g = 0,
		b = 0

	// 3 digits
	if (h.length == 4) {
		r = '0x' + h[1] + h[1]
		g = '0x' + h[2] + h[2]
		b = '0x' + h[3] + h[3]

		// 6 digits
	} else if (h.length == 7) {
		r = '0x' + h[1] + h[2]
		g = '0x' + h[3] + h[4]
		b = '0x' + h[5] + h[6]
	}

	return +r + ' ' + +g + ' ' + +b
}
