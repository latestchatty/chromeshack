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
            id: "chromeshack@github.com",
            strict_min_version: "42.0",
          },
        },
        background: {
          scripts: ["src/serviceWorker.ts"],
        },
        content_security_policy: {
          extension_pages: "script-src 'self'; object-src 'self'",
        },
      }
    : {
        background: {
          service_worker: "src/serviceWorker.ts",
          type: "module",
        },
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
      matches: ["https://www.shacknews.com/chatty*", "https://www.shacknews.com/tags-*"],
    },
  ],
  permissions: ["tabs", "storage", "scripting", "notifications", "alarms"],
  host_permissions: ["https://api.imgur.com/3/*", "https://winchatty.com/v2/*", "https://www.shacknews.com/chatty*"],
  web_accessible_resources: [
    {
      matches: ["*://*/*"],
      resources: ["images/*.png", "images/*.jpg"],
    },
  ],
};

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    "process.env": `(${JSON.stringify(process.env)})`,
  },
  plugins: [
    preact(),
    crx({
      manifest: defineManifest(crxConfig as any),
      browser: isFirefox,
    }),
  ],
  build: { outDir: "dist", minify: isFirefox === "firefox" ? false : true },

  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
});
