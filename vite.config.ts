import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx, defineManifest } from "@crxjs/vite-plugin";
import { name, description, version } from "./package.json";

const manifest = defineManifest({
  manifest_version: 3,
  name,
  version,
  description,
  action: {
    default_icon: "src/images/shack.png",
    default_title: "Chrome Shack",
    default_popup: "popup.html"
  },
  background: {
    service_worker: "src/background.ts",
    type: "module"
  },
  content_scripts: [
    {
      js: ["src/content.ts"],
      matches: [
        "https://shacknews.com/chatty*",
        "https://www.shacknews.com/chatty*",
        "https://shacknews.com/tags-*",
        "https://www.shacknews.com/tags-*"
      ]
    }
  ],
  permissions: [
    "tabs",
    "storage",
    "notifications"
  ],
  host_permissions: [
    "https://api.imgur.com/3/*",
    "https://api.gfycat.com/v1/gfycats/*",
    "https://filedrop.gfycat.com/*",
    "https://chattypics.com/*",
    "https://winchatty.com/v2/*",
    "https://*.youtube.com/embed/*",
    "https://api.streamable.com/videos/*",
    "https://api.twitter.com/1.1/statuses/show/*",
    "https://*.shacknews.com/chatty/*",
    "https://*.shacknews.com/chatty"
  ],
  web_accessible_resources: [{
    matches: ['*://*/*'],
    resources: [
      'src/images/*.png',
      'src/images/*.jpg',
    ],
  }]
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest,
    }),
  ],
});
