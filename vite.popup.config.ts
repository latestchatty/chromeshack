import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    emptyOutDir: false,
    sourcemap: process.env.NODE_ENV === 'development' ? true : false,
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: new URL('./src/popup.html', import.meta.url).pathname
      }
    },
  }
})
