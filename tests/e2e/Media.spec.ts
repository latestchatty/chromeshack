import { test, expect, navigate, type Page, BrowserContext, setTestCookie } from "../fixtures";

const mediaNavigate = async (page: Page, url: string, context?: BrowserContext) => {
    await navigate(page, url, undefined, context);
    const medialinks = page.locator("li.sel div.medialink");
    return medialinks;
};

test.describe("Imgur", () => {
    test("Imgur single-image album", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=42118101#item_42118101");
        // click toggles visibility of first embed media
        const targetEmbed = medialinks.nth(0);
        await targetEmbed.click();
        await expect(targetEmbed).toHaveClass("medialink toggled");
        const firstEmbed = targetEmbed.locator("div.media img").nth(0);
        expect(await firstEmbed.getAttribute("src")).toMatch("https://i.imgur.com/MS5SyIu.png");
        // clicking on media removes embed medialink child
        await firstEmbed.click();
        await expect(firstEmbed).not.toBeVisible();
    });
    test("Imgur single-image from named gallery", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=34877937#item_34877937");
        // click toggles visibility of first embed media
        const targetEmbed = medialinks.nth(2);
        await targetEmbed.click();
        await expect(targetEmbed).toHaveClass("medialink toggled");
        const firstEmbed = targetEmbed.locator("div.media img").nth(0);
        expect(await firstEmbed.getAttribute("src")).toMatch("https://i.imgur.com/27Uwc2u.jpg");
    });
    test("Imgur multi-image album with carousel", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=42114018#item_42114018");
        // click toggles visibility of first embed gallery
        const targetEmbed = medialinks.nth(0);
        await targetEmbed.click();
        await expect(targetEmbed).toHaveClass("medialink toggled");
        const firstEmbed = medialinks.locator("div.media img").nth(0);
        await expect(firstEmbed).toBeVisible();
        const slides = targetEmbed.locator("div.media .embla__slide");
        // first slide should be loaded and visible
        const firstSlide = slides.nth(0).locator("img");
        await expect(firstSlide).toBeInViewport({ ratio: 0.1 });
        expect(await firstSlide.getAttribute("src")).toMatch("https://i.imgur.com/PAQBtnb.jpg");
        // check that the first embed gallery buttons work correctly
        const emblaPrevBtn = targetEmbed.locator(".embla__button--prev");
        await expect(emblaPrevBtn).toHaveAttribute("disabled");
        const emblaNextBtn = targetEmbed.locator(".embla__button--next");
        await emblaNextBtn.click();
        const secondSlide = slides.nth(1).locator("img");
        await expect(secondSlide).toBeInViewport({ ratio: 0.1 });
        expect(await secondSlide.getAttribute("src")).toMatch("https://i.imgur.com/ZW1FSPI.jpg");
        await targetEmbed.locator(".embla__button--next").click({ clickCount: 2, delay: 100 });
        await emblaPrevBtn.click();
        const thirdSlide = slides.nth(2).locator("img");
        await expect(thirdSlide).toBeInViewport({ ratio: 0.1 });
        expect(await thirdSlide.getAttribute("src")).toMatch("https://i.imgur.com/iH06hK7.jpg");
    });
    test("Imgur multi-image carousel from named gallery", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=41972746#item_41972746");
        // click toggles visibility of 6th embed
        const targetEmbed = medialinks.nth(5);
        await targetEmbed.click();
        // first slide should be loaded and visible
        const slides = targetEmbed.locator("div.media .embla__slide");
        await expect(slides).toHaveCount(13);
        const firstSlide = slides.nth(0).locator("img");
        await expect(firstSlide).toBeInViewport({ ratio: 0.1 });
        expect(await firstSlide.getAttribute("src")).toMatch("https://i.imgur.com/dPMm4MC.jpg");
    });
    test("Imgur single video named album", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=35580068#item_35580068");
        const targetEmbed = medialinks.nth(0);
        await targetEmbed.click();
        // first slide should be loaded and visible
        const firstSlide = targetEmbed.locator("div.media video").nth(0);
        await expect(firstSlide).toBeInViewport({ ratio: 0.1 });
        expect(await firstSlide.getAttribute("src")).toMatch("https://i.imgur.com/bLutSUl.mp4");
    });
    test.skip("Imgur multi-video album with carousel", async ({ page }) => {
        // TODO: implement this test
        const medialinks = await mediaNavigate(page, "");
        const targetEmbed = medialinks.nth(0);
        await targetEmbed.click();
        // first slide should be loaded and visible
        const firstSlide = targetEmbed.locator("div.media video").nth(0);
        await expect(firstSlide).toBeInViewport({ ratio: 0.1 });
        expect(await firstSlide.getAttribute("src")).toMatch("");
    });
    test("Imgur video from named gallery", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39924469#item_39924469");
        const targetEmbed = medialinks.nth(1);
        await targetEmbed.click();
        // first slide should be loaded and visible
        const videoEmbed = targetEmbed.locator("div.media video").nth(0);
        await expect(videoEmbed).toBeInViewport({ ratio: 0.1 });
        expect(await videoEmbed.getAttribute("src")).toMatch("https://i.imgur.com/T3Pt5kF.mp4");
    });
});

test.describe("Direct-link media", () => {
    test("Direct-link image", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39953159#item_39953159");

        const targetEmbed = medialinks.nth(1);
        await targetEmbed.click();
        // first slide should be loaded and visible
        const firstSlide = targetEmbed.locator("div.media img").nth(0);
        await expect(firstSlide).toBeVisible();
        expect(await firstSlide.getAttribute("src")).toMatch("https://i.imgur.com/jECE21g.jpg");
    });
    test("Direct-link video", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39951145#item_39951145");

        const targetEmbed = medialinks.nth(0);
        await targetEmbed.click();
        // first slide should be loaded and visible
        const videoEmbed = targetEmbed.locator("div.media video");
        await expect(videoEmbed).toBeInViewport({ ratio: 0.1 });
        expect(await videoEmbed.getAttribute("src")).toMatch("https://i.imgur.com/itKm9JS.mp4");
    });
});

test("Chatty post", async ({ page }) => {
    const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39953159#item_39953159");

    const targetEmbed = medialinks.nth(0);
    await targetEmbed.click();
    const chattypostContainer = targetEmbed.locator(".chattypost__container");
    await expect(chattypostContainer).toBeInViewport({ ratio: 0.1 });
    // if chatty post loaded it should have body text
    const postbody = await chattypostContainer.locator("div.postbody").innerText();
    expect(postbody).toHaveLength(307);
});

test.describe("Dropbox", () => {
    test("Dropbox image", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39848548#item_39848548");

        const targetEmbed = medialinks.nth(0);
        await targetEmbed.click();
        const imageEmbed = targetEmbed.locator("div.media img");
        await expect(imageEmbed).toBeInViewport({ ratio: 0.1 });
        expect(await imageEmbed.getAttribute("src")).toMatch(
            "https://www.dropbox.com/s/r9feiqem9qiclqk/2016%20Bulked%20Up.jpg?raw=1"
        );
    });
    test("Dropbox video", async ({ page }) => {
        const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39596870#item_39596870");

        const targetEmbed = medialinks.nth(1);
        await targetEmbed.click();
        const videoEmbed = targetEmbed.locator("div.media video");
        await expect(videoEmbed).toBeInViewport({ ratio: 0.1 });
        expect(await videoEmbed.getAttribute("src")).toMatch(
            "https://www.dropbox.com/s/8qk8lfwwtaubk44/20200512_193538.mp4?raw=1"
        );
    });
});

test("Giphy video", async ({ page }) => {
    const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39945918#item_39945918");

    const targetEmbed = medialinks.nth(0);
    await targetEmbed.click();
    const videoEmbed = targetEmbed.locator("div.media video");
    await expect(videoEmbed).toBeInViewport({ ratio: 0.1 });
    expect(await videoEmbed.getAttribute("src")).toMatch("https://media0.giphy.com/media/YlRpYzrkHbtSYDAlaE/giphy.mp4");
});

test("Tenor image", async ({ page }) => {
    const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=39952739#item_39952739");

    const targetEmbed = medialinks.nth(0);
    await targetEmbed.click();
    const imageEmbed = targetEmbed.locator("div.media img");
    await expect(imageEmbed).toBeInViewport({ ratio: 0.1 });
    expect(await imageEmbed.getAttribute("src")).toMatch(
        "https://media1.tenor.com/images/383abee6c9e5f68c6b7ca5b3102f91ca/tenor.gif?itemid=5103046"
    );
});

test("Twimg image", async ({ page }) => {
    const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=42133497#item_42133497");

    const targetEmbed = medialinks.nth(0);
    await targetEmbed.click();
    const imageEmbed = targetEmbed.locator("div.media img");
    await expect(imageEmbed).toBeInViewport({ ratio: 0.1 });
    expect(await imageEmbed.getAttribute("src")).toMatch("https://pbs.twimg.com/media/F8mjw1aWwAA7Wfr.jpg");
});

test("Gstatic image", async ({ page }) => {
    const medialinks = await mediaNavigate(page, "https://www.shacknews.com/chatty?id=42133811#item_42133811");

    const targetEmbed = medialinks.nth(0);
    await targetEmbed.click();
    const imageEmbed = targetEmbed.locator("div.media img");
    await expect(imageEmbed).toBeInViewport({ ratio: 0.1 });
    expect(await imageEmbed.getAttribute("src")).toMatch(
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2dGlhF4jRBG7_ZuQvNgPyMU4ePky65bUCgg&usqp=CAU"
    );
});
