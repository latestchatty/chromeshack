import { resolve } from "node:path";
import { defineConfig } from "vite";

const devMode = process.env.NODE_ENV === "development";
const watcherOpts = devMode ? {} : undefined;

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: "dist-firefox",
    minify: false,
    watch: watcherOpts,
    sourcemap: devMode,
    lib: {
      formats: ["iife"],
      entry: resolve(__dirname, "./src/serviceWorker.firefox.ts"),
      name: "background scripts",
    },
    rollupOptions: {
      output: {
        entryFileNames: "background.global.js",
        extend: true,
      },
    },
  },
  server: {
    watch: {
      ignored: [
        "**/node_modules/**",
        "**/tests/**",
        "**/dist/**",
        "**/dist-firefox/**",
        "**/playwright-report/**",
        "**/test-results/**",
        "**/artifacts/**",
      ],
    },
  },
});
