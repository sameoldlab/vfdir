import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'
import { readFileSync } from 'fs'
import { loadEnv } from 'vite'

const target = 'es2022'
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	server: {
		port: 5461,
		https: mode === 'development' ? {
			key: readFileSync(`${__dirname}/certs/key.pem`),
			cert: readFileSync(`${__dirname}/certs/cert.pem`)
		} : null,
		proxy: {}
	},
	esbuild: { target },
	optimizeDeps: {
		esbuildOptions: { target }
	},
	build: { target },
	plugins: [sveltekit()],
	test: {
		environment: 'happy-dom',
		include: ['src/**/*.{test,test.svelte,spec}.{js,ts}'],
		browser: {
			enabled: true,
			name: 'brave'
		}
	}

}))
