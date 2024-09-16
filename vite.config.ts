import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'
import { readFileSync } from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 5461,
		https: {
			key: readFileSync('./certs/key.pem'),
			cert: readFileSync('./certs/cert.pem')
		},
		proxy: {}
	},

	plugins: [sveltekit()],

	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
})
