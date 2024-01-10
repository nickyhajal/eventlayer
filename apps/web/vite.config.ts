import { sveltekit } from '@sveltejs/kit/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
	plugins: [tsConfigPaths(), sveltekit()],
	server: {
		cors: false,
		port: 4424,
		host: '0.0.0.0',
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
	},
})
