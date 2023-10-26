// @ts-check

import { test as base, chromium, type BrowserContext, type Page, Browser } from "@playwright/test";
import path from "path";

import shackli from "./_shack_li_.json" assert { type: "json" };

export const loadExtensionDefaults = async (page: Page, opts?: any, data?: any) => {
    const _opts = Object.assign({}, { defaults: true }, opts || {});
    const _data = Object.assign({}, { enabled_suboptions: ["testing_mode"] }, data || {});
    await page.evaluate(
        ({ o, d }) => {
            window.localStorage.setItem("transient-opts", JSON.stringify(o));
            window.localStorage.setItem("transient-data", JSON.stringify(d));
        },
        { o: _opts, d: _data }
    );
};
export const navWithExtDefaults = async (
    page: Page,
    options: {
        url: string;
        opts?: any;
        data?: any;
    }
) => {
    await page.goto(options.url);
    await loadExtensionDefaults(page, options?.opts, options?.data);
};
export const setTestCookie = async (context: BrowserContext) => {
    await context.addCookies([
        {
            name: "_shack_li_",
            value: Object.values(shackli)[2]._shack_li_ as string,
            domain: ".shacknews.com",
            path: "/",
        },
    ]);
    return context;
};
export const navigate = async (page: Page, url: string, opts?: { o?: any; d?: any }, context?: BrowserContext) => {
    const { o, d } = opts || {};
    await navWithExtDefaults(page, { url, opts: o, data: d });
    if (context) await setTestCookie(context);
    await page.reload();
};

export const test = base.extend<{
    context: BrowserContext;
    extensionId: string;
}>({
    context: async ({}, use) => {
        const pathToExtension = path.resolve("./dist-chrome");
        const context = await chromium.launchPersistentContext("", {
            headless: false,
            args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
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