import { test, expect, navigate, type Page } from "../fixtures";

const waitForMedialinkIframe = async (page: Page) => {
  await page.waitForSelector("li.sel div.medialink", { state: "visible" });
  await page.locator("li.sel div.medialink").click();
  const iframe = page.locator("div.media iframe");
  return iframe;
};

test.describe("Youtube", () => {
  test("Youtube short-url video", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=39950627#item_39950627");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch("https://www.youtube.com/embed/DH6WUr5tfw4?autoplay=1");
  });
  test("Youtube short-url video at offset", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=39950460#item_39950460");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch("https://www.youtube.com/embed/Aq_1l316ow8?autoplay=1&start=16");
  });
  test("Youtube long-url video", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=42133365#item_42133365");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch("https://www.youtube.com/embed/2NNbF1Z_V_k?autoplay=1");
  });
  test("Youtube long-url video at offset", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=42123683#item_42123683");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch("https://www.youtube.com/embed/IC3MGrWZWDk?autoplay=1&start=46");
  });
  test("Youtube long-url video from playlist", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=29837558#item_29837558");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch(
      "https://www.youtube.com/embed/zXLeJFu57Wg?autoplay=1&list=PL9CBBEA5A85DBCDEF"
    );
  });
  test("Youtube Short", async ({ page, context }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=42278644#item_42278644", {}, context);

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch("https://www.youtube.com/embed/Cy6Xu2Spb8U?autoplay=1");
  })
});

test.describe("Twitch", () => {
  test("Twitch channel", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=34866345#item_34866345");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch(
      "https://player.twitch.tv/?channel=451fireman&parent=www.shacknews.com&autoplay=true&muted=false"
    );
  });
  test("Twitch long-form clip", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=39950638#item_39950638");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch(
      "https://clips.twitch.tv/embed?clip=EphemeralUnsightlyCarrotLeeroyJenkins&parent=www.shacknews.com&autoplay=true&muted=false"
    );
  });
  test("Twitch short-form clip", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=39596306#item_39596306");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch(
      "https://clips.twitch.tv/embed?clip=FastBloodyDelicataMau5&parent=www.shacknews.com&autoplay=true&muted=false"
    );
  });
  test("Twitch VOD", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=42092565#item_42092565");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch(
      "https://player.twitch.tv/?video=v1930049844&parent=www.shacknews.com&autoplay=true&muted=false"
    );
  });
  test("Twitch VOD at offset", async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=39646700#item_39646700");

    const iframe = await waitForMedialinkIframe(page);
    expect(await iframe.getAttribute("title")).toMatch(
      "https://player.twitch.tv/?video=v633051886&parent=www.shacknews.com&autoplay=true&muted=false&time=00h36m17s"
    );
  });
});

test("Streamable video", async ({ page }) => {
  await navigate(page, "https://www.shacknews.com/chatty?id=39821926#item_39821926");

  const iframe = await waitForMedialinkIframe(page);
  expect(await iframe.getAttribute("title")).toMatch("https://streamable.com/o/bn4mjy");
});

test("XboxDVR", async ({ page }) => {
  await navigate(page, "https://www.shacknews.com/chatty?id=38421840#item_38421840");

  const iframe = await waitForMedialinkIframe(page);
  expect(await iframe.getAttribute("title")).toMatch("https://xboxdvr.com/gamer/b1gben1810/video/71229659/embed");
});
