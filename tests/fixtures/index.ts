/* eslint import/named: 0 */

import fs from "fs";
import path from "path";

import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";

export const loadExtensionDefaults = async (page: Page, opts?: any, data?: any) => {
  const _data = { enabled_suboptions: ["testing_mode"], ...data };
  const _opts = { defaults: true, ...opts };
  await page.evaluate(
    ({ o, d }) => {
      window.localStorage.setItem("transient-opts", JSON.stringify(o));
      window.localStorage.setItem("transient-data", JSON.stringify(d));
    },
    { o: _opts, d: _data },
  );
};
export const setTestCookie = async (context: BrowserContext) => {
  // only load secure cookie from a trusted source
  try {
    const shackli = JSON.parse(process.env.E2E_SHACKLI) as any;
    await context.addCookies([
      {
        name: "_shack_li_",
        value: shackli[2]?._shack_li_ as string,
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
  // page.on("console", (msg) => console.log(msg.text()));
};

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // biome-ignore lint/correctness/noEmptyPattern: "blame the official docs"
  context: async ({}, use) => {
    const prodPath = path.resolve("./artifacts/dist");
    const devPath = path.resolve("./dist");
    const pathToExtension = fs.existsSync(prodPath) ? prodPath : devPath;
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
