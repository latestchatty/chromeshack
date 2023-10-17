import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": `(${JSON.stringify(process.env)})`
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    sourcemap: process.env.NODE_ENV === 'development' ? true : false,
    lib: {
      formats: ['iife'],
      entry: resolve(__dirname, './src/content.ts'),
      name: "content scripts",
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.global.js',
        extend: true,
      }
    }
  }
})
