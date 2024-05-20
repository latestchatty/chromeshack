import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import { description, version } from "./package.json";

const isFirefox = process.env.FIREFOX ? "firefox" : "chrome";

const browserMixin =
  isFirefox === "firefox"
    ? {
        browser_specific_settings: {
          gecko: {
            id: "{33a5e61a-ec1e-4761-9515-e7ab23a8b679}",
            strict_min_version: "109.0",
          },
        },
        background: {
          scripts: ["src/serviceWorker.firefox.ts"],
        },
        options_ui: {
          page: "src/permissions.html",
        },
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'self'",
        },
      }
    : {
        background: {
          service_worker: "src/serviceWorker.chrome.ts",
          type: "module",
        },
        minimum_chrome_version: "105.0",
      };

const crxConfig = {
  manifest_version: 3,
  name: "Chrome Shack",
  version,
  description,
  icons: {
    "16": "images/icon16.png",
    "48": "images/icon48.png",
    "96": "images/icon96.png",
    "128": "images/icon-chrome-web-store.png",
    "144": "images/icon144.png",
  },
  action: {
    default_icon: "images/icon16.png",
    default_title: "Chrome Shack",
    default_popup: "src/popup.html",
  },
  ...browserMixin,
  content_scripts: [
    {
      js: ["src/content.ts"],
      all_frames: false,
      run_at: "document_end",
      matches: ["https://www.shacknews.com/chatty*"],
    },
  ],
  permissions: ["tabs", "storage", "notifications", "alarms"],
  host_permissions: ["https://www.shacknews.com/chatty*"],
  web_accessible_resources: [
    {
      matches: ["*://*/*"],
      resources: ["images/*.png", "images/*.jpg"],
    },
  ],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    crx({
      manifest: defineManifest(crxConfig as any),
      browser: isFirefox,
    }),
  ],
  build: { outDir: "dist", minify: isFirefox !== "firefox" },

  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
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
