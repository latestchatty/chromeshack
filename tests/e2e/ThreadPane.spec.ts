import { test, expect, navigate } from "../fixtures";

test("valid cards clicked jumps to post", async ({ page }) => {
	await navigate(page, "https://www.shacknews.com/chatty", {
		d: { enabled_scripts: ["thread_pane"] },
	});

	// find the first card with replies
	await page.waitForSelector("div#cs_thread_pane", { state: "visible" });
	const cards = page.locator(".cs_thread_pane_card");
	let cardWithReplies;
	for (const card of await cards.all()) {
		const replies = card.locator(".cs_thread_pane_reply").all();
		if ((await replies).length > 0) {
			cardWithReplies = card;
			break;
		}
	}
	const cardBody = await cardWithReplies
		.locator(".cs_thread_pane_root_body")
		.innerText();
	expect(cardBody.length).toBeGreaterThan(0);

	// when card FFWD shortcut is clicked thread view jumps to the root post
	await cardWithReplies.locator(".cs_thread_pane_shortcut").click();
	const cardId = (await cardWithReplies.getAttribute("id"))?.substring(5);
	const rootFP = page.locator(`div.root#root_${cardId} .fullpost`);
	await expect(rootFP).toBeInViewport({ ratio: 0.1 });
	// when card body is clicked thread view jumps to newest reply
	await cardWithReplies.locator(".cs_thread_pane_root_body").click();
	const rootOL = page.locator(`div.root#root_${cardId} .oneline0`);
	await expect(rootOL).toBeInViewport();
});
test("reply icon and collapse interactions", async ({ page, context }) => {
	const postid = "40040022";
	await navigate(
		page,
		`https://www.shacknews.com/chatty?id=${postid}#item_${postid}`,
		{
			d: { enabled_scripts: ["thread_pane"] },
		},
		context,
	);
	await page.waitForSelector("div#cs_thread_pane", { state: "visible" });

	// find the reply icon in the list of replies (test 'cypresstest7654' user)
	// const replyIcon = page.locator(`div#item_${postid} div.cs_thread_contains_user`);
	// await expect(replyIcon).toBeVisible();

	// make sure card follows thread view state when (un)collapsing
	await page.locator("div.root>ul>li .postmeta>a.closepost").click();
	const card = page.locator(`div#item_${postid}`);
	await expect(card).toHaveClass(/collapsed/);
	await page.locator("div.root>ul>li .postmeta>a.showpost").click();
	await expect(card).not.toHaveClass(/collapsed/);
});
