/* eslint import/named: 0 */

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";

export const loadExtensionDefaults = async (page: Page, opts?: any, data?: any) => {
  const _data = { enabled_suboptions: ["testing_mode"], ...data };
  const _opts = { defaults: true, ...opts };
  await page.evaluate(
    ({ o, d }) => {
      window.localStorage.setItem("transient-opts", JSON.stringify(o));
      window.localStorage.setItem("transient-data", JSON.stringify(d));
      console.log("setting up testing environment:", JSON.stringify({ o, d }));
    },
    { o: _opts, d: _data },
  );
};
export const setTestCookie = async (context: BrowserContext) => {
  // only load secure cookie from a trusted source
  try {
    const shackli: Record<string, string>[] = JSON.parse(process.env.E2E_SHACKLI || "[]");
    if (!shackli?.length) return console.error("setTestCookie unable to parse secure cookie from .env!");

    await context.addCookies([
      {
        name: "_shack_li_",
        value: shackli[2]?._shack_li_,
        domain: ".shacknews.com",
        path: "/",
      },
    ]);
  } catch (e) {
    console.error("Failed to parse the secure cookie from E2E_SHACKLI: ", e);
  }
  return context;
};
export const navigate = async (page: Page, url: string, opts?: { o?: any; d?: any }, context?: BrowserContext) => {
  const { o, d } = opts || {};
  await page.goto(url);
  if (opts) await loadExtensionDefaults(page, o, d);
  if (context) await setTestCookie(context);
  await page.reload();
  // for debugging use env var: PWDEBUG=console
  if (process.env.PWDEBUG === "console") page.on("console", (msg) => console.log(msg.text()));
};

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: "blame the official docs"
  context: async ({}, use) => {
    const distPath = path.resolve("./dist/chrome-mv3");
    const distPathManifest = path.resolve(distPath, "manifest.json");
    const pathToExtension = fs.existsSync(distPathManifest) ? distPath : null;
    if (pathToExtension === null) throw new Error("Could not find extension");

    const context = await chromium.launchPersistentContext("", {
      headless: false,
      args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`, "--headless=new"],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    /*
        // for manifest v2:
        let [background] = context.backgroundPages()
        if (!background)
        background = await context.waitForEvent('backgroundpage')
        */
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");

    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});
export const expect = test.expect;
export type { Page, BrowserContext };
