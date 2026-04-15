import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/rewards/',
  server: {
    host: true,
    port: 9002,
    strictPort: true,
    hmr: {
      clientPort: 443,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
