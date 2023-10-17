import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    sourcemap: process.env.NODE_ENV === 'development' ? true : false,
    lib: {
      formats: ['iife'],
      entry: resolve(__dirname, './src/serviceWorker.ts'),
      name: "background scripts",
    },
    rollupOptions: {
      output: {
        entryFileNames: 'background.global.js',
        extend: true,
      }
    },
  }
})
