/** @type {import('tailwindcss').Config}*/
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}', '../../packages/ui/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			maxWidth: {
				'8xl': '86rem',
			},
			boxShadow: {
				'line-sm': '0 1px 0px 0 rgba(0, 0, 0, 0.06)',
				line: '0 2px 0px 0 rgba(0, 0, 0, 0.06)',
				'line-lg': '0 4px 0px 0 rgba(0, 0, 0, 0.06)',
				lg: '0px 10px 65px rgba(0, 0, 0, 0.04), 0px 4.91399px 34.1746px rgba(0, 0, 0, 0.0298054), 0px 2.75474px 19.158px rgba(0, 0, 0, 0.025), 0px 1.46302px 10.1747px rgba(0, 0, 0, 0.0201946), 0px 0.608796px 4.2339px rgba(0, 0, 0, 0.0140573)',
			},
		},
	},

	plugins: [],
}

module.exports = config
