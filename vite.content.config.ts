import { resolve } from "path";
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const devMode = process.env.NODE_ENV === "development";
const watcherOpts = devMode ? {} : undefined;

export default defineConfig({
  plugins: [preact()],
  define: {
    "process.env": `(${JSON.stringify(process.env)})`,
  },
  build: {
    emptyOutDir: false,
    outDir: "dist-firefox",
    minify: false,
    sourcemap: devMode,
    watch: watcherOpts,
    lib: {
      formats: ["iife"],
      entry: resolve(__dirname, "./src/content.ts"),
      name: "content scripts",
    },
    rollupOptions: {
      output: {
        entryFileNames: "content.global.js",
        extend: true,
      },
    },
  },
});
