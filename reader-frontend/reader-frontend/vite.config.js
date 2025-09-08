import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  define: {
    // Fix for some libraries that expect process.env
    global: 'globalThis',
  }
})