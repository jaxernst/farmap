import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const PUBLIC_API_URL = "http://localhost:3001"

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		proxy: {
			'/api': {
				target: PUBLIC_API_URL,
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			}
		},
		allowedHosts: true
	},
});
