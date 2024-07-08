import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import mkcert from 'vite-plugin-mkcert'
// https://vitejs.dev/config/
export default defineConfig({
	optimizeDeps: {
		exclude: ['@sqlite.org/sqlite-wasm'],
	},
	plugins: [
		mkcert({
			mkcertPath: '/usr/bin/mkcert',
			savePath: './certs',
		}),
		sveltekit(),
	],
})
