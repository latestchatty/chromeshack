import { resolve } from "node:path";
import { defineConfig } from "vite";
import fs from "node:fs/promises";
import preact from "@preact/preset-vite";

const devMode = process.env.NODE_ENV === "development";
const watcherOpts = devMode ? {} : undefined;

function copyManifestPlugin() {
  return {
    name: "copy-manifest",
    generateBundle(outputOptions, bundle) {
      // Copy manifest.json to dist directory
      fs.copyFile("src/manifestv3.ffx.json", "dist-firefox/manifest.json")
        .then(() => console.log("manifest.json copied to dist-firefox/"))
        .catch((err) => console.error("Error copying manifest.json:", err));
    },
  };
}

export default defineConfig({
  define: { "process.env": "{}" },
  plugins: [preact(), copyManifestPlugin()],
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
