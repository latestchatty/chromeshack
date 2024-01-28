import { resolve } from "path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const devMode = process.env.NODE_ENV === "development";
const watcherOpts = devMode ? {} : undefined;

export default defineConfig({
  plugins: [preact()],
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
});
