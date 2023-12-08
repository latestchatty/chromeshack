import { test, expect, navigate } from "../fixtures";

const url = "https://www.shacknews.com/chatty?id=38731437#item_38731437";

test("Shacktags legend interactions", async ({ page, context }) => {
	await navigate(page, url, undefined, context);
	// toggle state persistence
	const replyBtn = page.locator("li li.sel div.reply>a");
	await replyBtn.click();
	const table = page.locator("li li.sel #shacktags_legend_table");
	await expect(table).toBeHidden();
	const toggleBtn = page.locator("li li.sel a#shacktags_legend_toggle");
	await toggleBtn.click();
	await expect(table).toBeVisible();
	await page.locator("li li.sel div.closeform>a").click();
	await replyBtn.click();
	await expect(table).toBeVisible();
});

test("Drafts - input and persistence", async ({ page, context }) => {
	await navigate(page, url, { d: { enabled_scripts: ["drafts"] } }, context);

	const replyBtn = page.locator("li li.sel div.reply>a");
	await replyBtn.click();
	const draftsDot = page.locator("li li.sel div.drafts__dot");
	await expect(draftsDot).toBeVisible();

	// confirms DraftsApp can serialize and deserialize a draft
	const msg =
		"Aliquam purus sit amet luctus venenatis lectus magna fringilla urna. Fames ac turpis egestas maecenas pharetra convallis posuere morbi leo. Nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit amet. 👍🏼";
	const replyInput = page.locator("li li.sel textarea#frm_body");
	await replyInput.fill(msg);
	await expect(replyInput).toHaveValue(msg);
	await expect(draftsDot).toHaveClass(/valid/);
	await page.waitForTimeout(1000);
	await page.locator("li li.sel div.closeform>a").click();
	await replyBtn.click();
	await expect(replyInput).toHaveValue(msg);
	await expect(draftsDot).toHaveClass(/valid/);
	// test that it works through a page reload
	await page.reload();
	await replyBtn.click();
	await expect(replyInput).toHaveValue(msg);
	await expect(draftsDot).toHaveClass(/valid/);
});

test("Templates - input and persistence", async ({ page, context }) => {
	await navigate(page, url, { d: { enabled_scripts: ["templates"] } }, context);

	const replyBtn = page.locator("li li.sel div.reply>a");
	await replyBtn.click();

	const msg =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sit amet luctus venenatis lectus magna fringilla urna porttitor. Lectus vestibulum mattis ullamcorper velit sed ullamcorper morbi tincidunt. Purus semper eget duis at tellus at urna condimentum mattis. Ipsum a arcu cursus vitae congue. At ultrices mi tempus imperdiet nulla malesuada pellentesque elit. Nam libero justo laoreet sit amet cursus sit. Consequat nisl vel pretium lectus quam id. Justo laoreet sit amet cursus sit amet. Sed sed risus pretium quam vulputate dignissim suspendisse in.";
	const replyInput = page.locator("li li.sel textarea#frm_body");
	await replyInput.fill(msg);
	await expect(replyInput).toHaveValue(msg);
	const templatesBtn = page.locator("li li.sel button#templates__btn");
	await templatesBtn.click();
	const templatesSaveBtn = page.locator("li li.sel button#save__btn");
	await templatesSaveBtn.click();
	const closeFormBtn = page.locator("li li.sel div.closeform>a");
	await closeFormBtn.click();
	await replyBtn.click();
	await expect(replyInput).toHaveValue("");
	await templatesBtn.click();
	const firstTemplate = page
		.locator("li li.sel div.template__item>span")
		.nth(0);
	await firstTemplate.click();
	// confirms TemplatesApp can hold and retrieve a template
	await expect(replyInput).toHaveValue(msg);

	// test for serialization consistency
	const templatesAddBtn = page.locator("li li.sel button#add__btn");
	await templatesAddBtn.click({ clickCount: 2 });
	const templateItems = page.locator("li li.sel div.template__item");
	await expect(templateItems).toHaveCount(3);
	await closeFormBtn.click();
	await replyBtn.click();

	await templatesBtn.click();
	const templatesDelBtns = page.locator("li li.sel button#del__btn");
	await templatesDelBtns.nth(1).click();
	await templatesDelBtns.nth(1).click();
	await templatesDelBtns.nth(0).click();
	const templateItemsSpans = page.locator("li li.sel div.template__item>span");
	await expect(templateItemsSpans.nth(0)).toHaveText(/Template #1/);
});

test("PostPreview complex interactions", async ({ page, context }) => {
	await navigate(page, url, { d: { enabled_scripts: ["drafts"] } }, context);

	const replyBtn = page.locator("li li.sel div.reply>a");
	await replyBtn.click();

	// test input and visibility state transitions
	page.locator("#previewButton").click();
	const replyInput = page.locator("li li.sel textarea#frm_body");
	const previewBtn = page.locator("li li.sel #previewButton");
	await previewBtn.click();
	const previewArea = page.locator("li li.sel #previewArea");
	await expect(previewArea).toBeVisible();
	// test for serialization consistency
	const msg = "This is a test of the post preview feature.";
	await replyInput.fill(msg);
	await page.waitForTimeout(751);
	await expect(previewArea).toHaveText(msg);
	// catch flakiness with toggling postform
	await page.locator("li li.sel div.closeform>a").click();
	await replyBtn.click();
	if (!(await page.waitForSelector("textarea#frm_body", { timeout: 1000 }))) {
		await replyBtn.click({ clickCount: 2 });
	}
	await expect(previewArea).toHaveText(msg);
});
test("PostPreview - url detection", async ({ page, context }) => {
	await navigate(page, url, undefined, context);

	const replyBtn = page.locator("li li.sel div.reply>a");
	await replyBtn.click();

	const previewBtn = page.locator("li li.sel #previewButton");
	await previewBtn.click();
	const replyInput = page.locator("li li.sel textarea#frm_body");
	const previewArea = page.locator("li li.sel #previewArea");
	await expect(previewArea).toBeVisible();
	// test for url detection and rendering in the preview box
	const msg =
		"Just some text with a url in it https://github.com/latestchatty/chromeshack/issues.";
	const rendered =
		'Just some text with a url in it <a href="https://github.com/latestchatty/chromeshack/issues" target="_blank" rel="noopener noreferrer">https://github.com/latestchatty/chromeshack/issues</a>.';
	await replyInput.fill(msg);
	await page.waitForTimeout(333);
	await expect(replyInput).toHaveValue(msg);
	expect(await previewArea.innerHTML()).toMatch(rendered);
});
test("PostPreview - codeblock formatting", async ({ page, context }) => {
	await navigate(page, url, undefined, context);

	const replyBtn = page.locator("li li.sel div.reply>a");
	await replyBtn.click();
	const toggleBtn = page.locator("li li.sel a#shacktags_legend_toggle");
	await toggleBtn.click();

	page.locator("#previewButton").click();
	const replyInput = page.locator("li li.sel textarea#frm_body");
	const previewArea = page.locator("li li.sel #previewArea");
	await previewArea.scrollIntoViewIfNeeded();
	await expect(previewArea).toBeVisible();
	// test for codeblock detection and rendering in the preview box
	const msg = `&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
&&&&&&&&&&&&&&&&&&&&&&%####%%&&&&&&&&&&&&&&&&&&&
&&&&&&&&&&&&&&&%(////(((((((((////(%&&&&&&&&&&&&
&&&&&&&&&&&%(//(%&&&&&&&&&&&&&&&&%#(//(%&&&&&&&&
&&&&&&&&&#//#&&&&%/.    .*%&&&&&&&&&&%///%&&&&&&
&&&&&&&%//#&&(,              ,(&&&&&&&&%(/(&&&&&
&&&&&&%%%/                        *%&&&&&#//#&&&
&&&%(,                                ,(%&#//%&&
&&&&#((%&&&.     (&&&&&&&&#.     &&&&&&&&&&//(&&
&&&&(/(%&&&,     /&&&&&&&&(     .&&&&&&&&&&%//%&
&&&&(/(%&&&*     /&&&&&&&&/     *&&&&&&&&&&#//%&
&&&&(//#&&&(     *&,.#&&&&/     (&&&&&&&&&&//(&&
&&&&%//(%&&#     *&&&&&&&&*     (&&&&&&&&&#//%&&
&&&&&%///%&%.    ,&&&&&&&&*     #&&&&&&&&(//#&&&
&&&&&&%(//(%*,,,,*&&&&&&&&/,,,,*%&&&&&&#//(&&&&&
&&&&&&&&%(//(%&&&&&&&&&&&&&&&&&&&&&&&#//(%&&&&&&
&&&&&&&&&&&#///(#%&&&&&&&&&&&&&&%#(///#%&&&&&&&&
&&&&&&&&&&&&&&%(//////((((((//////(%&&&&&&&&&&&&
&&&&&&&&&&&&&&&&&&&&%%######%%&&&&&&&&&&&&&&&&&&`;
	const rendered =
		"&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%####%%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(////(((((((((////(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(//(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%#(//(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//#&amp;&amp;&amp;&amp;%/.    .*%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%///%&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;%//#&amp;&amp;(,              ,(&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(/(&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;%%%/                        *%&amp;&amp;&amp;&amp;&amp;#//#&amp;&amp;&amp;<br>&amp;&amp;&amp;%(,                                ,(%&amp;#//%&amp;&amp;<br>&amp;&amp;&amp;&amp;#((%&amp;&amp;&amp;.     (&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#.     &amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;//(&amp;&amp;<br>&amp;&amp;&amp;&amp;(/(%&amp;&amp;&amp;,     /&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;(     .&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%//%&amp;<br>&amp;&amp;&amp;&amp;(/(%&amp;&amp;&amp;*     /&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;/     *&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//%&amp;<br>&amp;&amp;&amp;&amp;(//#&amp;&amp;&amp;(     *&amp;,.#&amp;&amp;&amp;&amp;/     (&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;//(&amp;&amp;<br>&amp;&amp;&amp;&amp;%//(%&amp;&amp;#     *&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;*     (&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//%&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;%///%&amp;%.    ,&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;*     #&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;(//#&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;%(//(%*,,,,*&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;/,,,,*%&amp;&amp;&amp;&amp;&amp;&amp;#//(&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(//(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//(%&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#///(#%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%#(///#%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(//////((((((//////(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%%######%%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;";
	await replyInput.fill(msg);
	await page.waitForTimeout(333);
	await expect(replyInput).toHaveValue(msg);
	// test tagging a selected block of text
	await replyInput.selectText();
	page
		.locator(
			"li li.sel #shacktags_legend_table tr:nth-child(8) > td:nth-child(4) > a",
		)
		.click();
	const codeTag = previewArea.locator(".jt_code");
	expect(await codeTag.nth(0).innerHTML()).toMatch(rendered);
});
