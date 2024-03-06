import { test, expect, navigate } from "../fixtures";

test.describe("User Flairs", () => {
  const url = "https://www.shacknews.com/chatty?id=40040034#item_40040034";

  test("enabled", async ({ page }) => {
    await navigate(page, url);

    const icon = page.locator("li.sel img.chatty-user-icons").nth(0);
    await expect(icon).toHaveCSS("width", "10px");
    const filter = page.locator("li.sel img.chatty-user-icons").nth(0);
    await expect(filter).toHaveCSS("filter", "grayscale(0.75)");
  });
  test("disabled", async ({ page }) => {
    await navigate(page, url, {
      o: { exclude: true },
      d: { enabled_scripts: ["shrink_user_icons", "reduced_color_user_icons"] },
    });

    const icon = page.locator("li.sel img.chatty-user-icons").nth(0);
    await expect(icon).toHaveCSS("width", "14px");
    const filter = page.locator("li.sel img.chatty-user-icons").nth(0);
    await expect(filter).not.toHaveCSS("filter", "grayscale(0.75)");
  });
});

test.describe("LOL Tags", () => {
  const url = "https://www.shacknews.com/chatty?id=40046772#item_40046772";

  test("enabled", async ({ page }) => {
    await navigate(page, url);

    const tags = page.locator(".fullpost .lol-tags").nth(0);
    await expect(tags).toHaveCSS("display", "flex");
    const olTag = page.locator(".oneline .lol-tags").nth(0);
    await expect(olTag).toHaveCSS("display", "inline-block");
  });
  test("disabled", async ({ page }) => {
    await navigate(page, url, {
      d: { enabled_scripts: ["hide_tagging_buttons", "hide_tag_counts"] },
    });

    const tag = page.locator(".fullpost .lol-tags").nth(0);
    await expect(tag).toHaveCSS("display", "none");
    const olTagItem = page.locator(".oneline .lol-tags").nth(0);
    await expect(olTagItem).toHaveCSS("display", "none");
  });
});

test("shame switchers enabled", async ({ page }) => {
  await navigate(page, "https://www.shacknews.com/chatty?id=40049133#item_40049133", {
    d: { enabled_scripts: ["switchers"] },
  });

  await expect(page.locator("li li.sel span.user")).toHaveText(/\w+ - \(\w+\)/);
});

test("chatty-news enabled", async ({ page }) => {
  await navigate(page, "https://www.shacknews.com/chatty?id=40049762#item_40049762", {
    d: { enabled_scripts: ["chatty_news"] },
  });
  await page.waitForSelector("div.chatty__news__enabled");

  const newsItems = await page.locator(".chatty-news ul#recent-articles li").count();
  expect(newsItems).toBeGreaterThan(0);
  const articleLinks = await page.locator(".chatty-news a[title]").count();
  expect(articleLinks).toBeGreaterThan(0);

  // test that the alignment helper classes get loaded on the main Chatty
  await navigate(page, "https://www.shacknews.com/chatty", {
    d: { enabled_scripts: ["thread_pane", "chatty_news"] },
  });
  const articleContent = page.locator("div.article-content");
  await expect(articleContent).toHaveClass(/thread__pane__enabled/);
  await expect(articleContent).toHaveClass(/chatty__news__enabled/);
});

test.describe("CustomUserFilter", () => {
  const url = "https://www.shacknews.com/chatty?id=40049762#item_40049762";

  test("CustomUserFilter on author in single-thread mode", async ({ page }) => {
    await navigate(page, url, {
      d: { user_filters: ["ForcedEvolutionaryVirus"] },
    });

    const fullpost = page.locator("li .fullpost");
    await expect(fullpost).toBeVisible();
    const olUser = page.locator("li .oneline_user");
    expect(await olUser.count()).toBeLessThanOrEqual(0);
  });
  test("CustomUserFilter on replies in single-thread mode", async ({ page }) => {
    await navigate(page, url, {
      d: { user_filters: ["Milleh"] },
    });

    const onelines = await page.locator(".oneline_user").allInnerTexts();
    for (const user in onelines) {
      expect(user).not.toMatch("Milleh");
    }
  });
});

test("HighlightUser highlighting", async ({ page }) => {
  await navigate(page, "https://www.shacknews.com/chatty?id=40049283#item_40049283", {
    o: { append: true },
    d: {
      highlight_groups: [
        {
          name: "Another Group",
          enabled: true,
          built_in: false,
          css: "color: rgb(0, 255, 255) !important;",
          users: ["Yo5hiki"],
        },
      ],
    },
  });

  // check for 'color' 'yellow'
  const hl_olUser = page.locator(".oneline.op .oneline_user").nth(0);
  await expect(hl_olUser).toHaveCSS("color", "rgb(255, 255, 0)");
  // check for 'color' 'cyan'
  const olUser = await page.locator(".oneline_user").all();
  for (const user of olUser) {
    if ((await user.innerText()) === "Yo5hiki") await expect(user).toHaveCSS("color", "rgb(0, 255, 255)");
  }
});

test.describe("NewCommentHighlighter", () => {
  const url = "https://www.shacknews.com/chatty?id=42269502#item_42269502";

  test("basic highlighting with fresh state", async ({ page, context }) => {
    // test with fresh state
    await navigate(page, url, {}, context);
    const highlights = page.locator(".newcommenthighlighter");
    await expect(highlights).toHaveCount(0);

    // check that nothing highlights when refreshing after a normal run
    await page.reload();
    await expect(highlights).toHaveCount(0);
  });
  test("normal execution", async ({ page, context }) => {
    await navigate(
      page,
      url,
      {
        o: { append: true },
        d: { new_comment_highlighter_last_id: { 42269502: 42270595 } },
      },
      context
    );
    const highlights = page.locator(".newcommenthighlighter");
    await expect(highlights).toHaveCount(1);

    // make sure nothing highlights when root refresh button is clicked
    const refreshBtn = page.locator("div.refresh > a").nth(0);
    await refreshBtn.click();
    await expect(highlights).toHaveCount(0);
  });
});
test.describe("NewCommentHighlighter - time validated highlighting", () => {
  const url = "https://www.shacknews.com/chatty?id=42269502#item_42269502";

  test("fresh state", async ({ page, context }) => {
    await navigate(
      page,
      url,
      {
        o: { append: true },
        d: { new_comment_highlighter_last_id: { 42269502: 42270597 }, last_highlight_time: Date.now() },
      },
      context
    );
    const highlights = page.locator(".newcommenthighlighter");
    await expect(highlights).toHaveCount(0);
  });
  test("stale id with fresh time", async ({ page, context }) => {
    await navigate(
      page,
      url,
      {
        o: { append: true },
        d: { new_comment_highlighter_last_id: { 42269502: 42270595 }, last_highlight_time: Date.now() },
      },
      context
    );
    const highlights = page.locator(".newcommenthighlighter");
    await expect(highlights).toHaveCount(1);
  });
  test("stale id with stale time", async ({ page, context }) => {
    // NCH minimum highlight stale time threshold is <=4 hours
    const staleThresh = 1000 * 60 * 60 * 4 + 60000;
    const staleTime = Date.now() + staleThresh;
    // this would normally highlight the whole thread
    await navigate(
      page,
      url,
      {
        o: { append: true },
        d: { new_comment_highlighter_last_id: { 42269502: 42269502 }, last_highlight_time: staleTime },
      },
      context
    );
    const highlights = page.locator(".newcommenthighlighter");
    // shouldn't highlight here due to stale time unless we're refreshing via the root-refresh button
    await expect(highlights).toHaveCount(0);
  });
  test("stale id with unset time case", async ({ page, context }) => {
    await navigate(
      page,
      url,
      {
        o: { append: true },
        d: { new_comment_highlighter_last_id: { 42269502: 42270323 }, last_highlight_time: -1 },
      },
      context
    );
    const highlights = page.locator(".newcommenthighlighter");
    await expect(highlights).toHaveCount(6);
  });
});

test("ColorGauge - post load and refresh", async ({ page }) => {
  await navigate(page, "https://www.shacknews.com/chatty?id=42278065#item_42278065");

  const gauge = page.locator("div.guage");
  const colorClass = gauge.locator("div.progress");
  await expect(gauge).toHaveAttribute("title");
  await expect(colorClass).toHaveClass(/gauge_/);

  // test the refresh button event
  const refreshBtn = page.locator("div.refresh > a").nth(0);
  await refreshBtn.click();
  await expect(gauge).toHaveAttribute("title");
  await expect(colorClass).toHaveClass(/gauge_/);
});
