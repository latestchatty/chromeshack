import { defineConfig } from "vite";

const devMode = process.env.NODE_ENV === "development";
const watcherOpts = devMode ? {} : undefined;

export default defineConfig({
  build: {
    emptyOutDir: false,
    sourcemap: devMode,
    outDir: "dist-firefox",
    watch: watcherOpts,
    rollupOptions: {
      input: {
        permissions: new URL("./src/permissions.html", import.meta.url).pathname,
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
      ],
    },
  },
});
