import { resolve } from 'path'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
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
