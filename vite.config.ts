import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  plugins: [sveltekit()],
})
