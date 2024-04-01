import { sveltekit } from '@sveltejs/kit/vite'
import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [tsConfigPaths(), sveltekit(), SvelteKitPWA()],
	server: {
		cors: false,
		port: 8884,
		host: '0.0.0.0',
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
	},
})
