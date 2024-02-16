import { test, expect, navigate, Page } from "../fixtures";

const singlePostURL = "https://www.shacknews.com/chatty?id=42267857#item_42267857";

test.describe("scrollToPost", () => {
  const expectScrolled = async (page: Page) => {
    // expect fullpost to be positioned by default under the topbar in the viewport
    await expect(page.locator("li.sel li.sel > div.fullpost")).toBeInViewport({ ratio: 0.5 });
    await page.reload();
    await expect(page.locator("li.sel li.sel > div.fullpost")).toBeInViewport({ ratio: 0.5 });
  };

  test("disabled on initial Chatty load", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty");
    await expect(page.locator("div#featured-article")).toBeInViewport();
    await page.reload();
    await expect(page.locator("div#featured-article")).toBeInViewport();
  });

  test("enabled on single post", async ({ page }) => {
    await navigate(page, singlePostURL);
    await expect(page.locator("li.sel .fullpost").nth(1)).toBeInViewport();
    await page.reload();
    await expect(page.locator("li.sel .fullpost").nth(1)).toBeInViewport();
  });
  test("disabled globally viewing single post", async ({ page }) => {
    await navigate(page, singlePostURL, {
      o: { exclude: true },
      d: { enabled_builtins: ["scroll_behavior"] },
    });
    await expectScrolled(page);
  });
  test("disabled single-thread fix", async ({ page }) => {
    await navigate(page, singlePostURL, {
      o: { exclude: true },
      d: { enabled_builtins: ["single_thread_fix"] },
    });
    await expectScrolled(page);
  });
});

test("disable image-uploader", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["image_uploader"] },
  });
  const replyBtn = page.locator("li.sel li.sel div.reply > a");
  await replyBtn.click();
  const uploaderContainer = page.locator("div.image__uploader__container");
  await expect(uploaderContainer).toHaveCount(0);
});
test("disable enhanced shacktags", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["comment_tags"] },
  });
  const replyBtn = page.locator("li.sel li.sel div.reply > a");
  await replyBtn.click();
  const tagsContainer = page.locator("div#comment_tags_container");
  await expect(tagsContainer).toHaveCount(0);
});
test("disable user-popup menu", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["user_popup"] },
  });
  const userBtns = page.locator("li.sel > div.fullpost span.user");
  await expect(userBtns.nth(0)).not.toHaveClass(/enhanced/);
  await expect(userBtns.nth(1)).not.toHaveClass(/enhanced/);
});
test("disable enhanced collapse", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["collapse"] },
  });
  const closeBtns = page.locator("div.root div.postmeta > a.closepost");
  await expect(closeBtns.nth(0)).not.toHaveClass(/enhanced/);
  await expect(closeBtns.nth(1)).not.toHaveClass(/enhanced/);
});
test("disable enhanced gauges", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["color_gauge"] },
  });
  const postGauge = page.locator("div.root div.guage > div.progress");
  await expect(postGauge).not.toHaveClass(/gauge_dead/);
});
test("disable emoji poster", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["emoji_poster"] },
  });
  const replyBtns = page.locator("li.sel div.reply > a");
  await replyBtns.nth(0).click();
  const emojiTagLine = page.locator("div.postbox p.rules > div.emoji-tagline");
  await expect(emojiTagLine).toHaveCount(0);
});
test("disable post-length counter", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["post_length_counter"] },
  });
  const replyBtns = page.locator("li.sel div.reply > a");
  await replyBtns.nth(0).click();
  const counterText = page.locator("div.postbox div#post_length_counter_text");
  await expect(counterText).toHaveCount(0);
});
test("disable local timestamp", async ({ page }) => {
  await navigate(page, singlePostURL, {
    o: { exclude: true },
    d: { enabled_builtins: ["local_timestamp"] },
  });
  const timestamps = page.locator("li.sel div.postdate");
  await expect(timestamps.nth(0)).not.toHaveClass(/timestamp_corrected/);
});
test("disable enhanced mod banners", async ({ page }) => {
  await navigate(page, "https://www.shacknews.com/chatty?id=42303137#item_42303137", {
    o: { exclude: true },
    d: { enabled_builtins: ["mod_banners"] },
  });
  const fullpost = page.locator("div.root li.sel > div.fullpost");
  expect(fullpost).not.toHaveClass(/enhanced_banners/);
});
