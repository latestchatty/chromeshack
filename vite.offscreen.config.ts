import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    sourcemap: process.env.NODE_ENV === 'development' ? true : false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        offscreen: new URL('./src/offscreen.html', import.meta.url).pathname
      }
    },
  }
})
