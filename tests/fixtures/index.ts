/* eslint import/named: 0 */

import {
	test as base,
	chromium,
	type BrowserContext,
	type Page,
} from "@playwright/test";
import path from "path";

// @ts-ignore
import cookieFixture from "./_shack_li_.json" assert { type: "json" };

export const loadExtensionDefaults = async (
	page: Page,
	opts?: any,
	data?: any,
) => {
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
  if (cookieFixture == null) return;
  const shackli: any = Object.values(cookieFixture);

	await context.addCookies([
		{
			name: "_shack_li_",
			value: shackli[2]?._shack_li_ as string,
			domain: ".shacknews.com",
			path: "/",
		},
	]);
	return context;
};
export const navigate = async (
	page: Page,
	url: string,
	opts?: { o?: any; d?: any },
	context?: BrowserContext,
) => {
	const { o, d } = opts || {};
	await page.goto(url);
	if (opts) await loadExtensionDefaults(page, o, d);
	if (context) await setTestCookie(context);
	await page.reload();
};

export const test = base.extend<{
	context: BrowserContext;
	extensionId: string;
}>({
	context: async ({}, use) => {
		const pathToExtension = path.resolve("./dist");
		const context = await chromium.launchPersistentContext("", {
			headless: false,
			args: [
				`--disable-extensions-except=${pathToExtension}`,
				`--load-extension=${pathToExtension}`,
			],
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
