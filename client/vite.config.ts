import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@server/index': fileURLToPath(new URL('../server/src/index.ts', import.meta.url)),
			'@common': fileURLToPath(new URL('../common/src', import.meta.url)),
			'@db': fileURLToPath(new URL('../db/src', import.meta.url)),
		},
	},
	server: {
		proxy: {
			'/trades': {
				target: 'http://localhost:3000',
				ws: true,
			},
		},
	},
})
