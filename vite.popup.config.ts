import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
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
