import { test, expect, navigate } from "../fixtures";

test.beforeEach(async ({ page }) => {
    await navigate(page, "https://www.shacknews.com/chatty?id=40148393#item_40148393");
});

test("UserPopup toggling", async ({ page }) => {
    // check that popup renders and toggles correctly
    const userSpan = page.locator("li.sel>.fullpost span.user");
    await userSpan.click();
    const ddContainer = page.locator("div.userDropdown");
    const ddItems = ddContainer.locator(".dropdown__container .dropdown__item");
    await expect(ddItems.nth(0).locator("span")).toContainText("shirif's Posts");
    await userSpan.click();
    await expect(ddContainer).not.toBeAttached();
});

test("UserPopup mutates custom-filters", async ({ page }) => {
    // check that popup renders and toggles correctly
    const userSpan = page.locator("li.sel>.fullpost span.user");
    await userSpan.click();
    const ddContainer = page.locator("div.userDropdown");
    const ddItems = ddContainer.locator(".dropdown__container .dropdown__item");

    // check that popup mutates custom-filters
    const customFilter = ddItems.nth(7).locator("span");
    await expect(customFilter).toHaveText("Add to Custom Filters");
    await customFilter.click();
    await expect(customFilter).toHaveText("Remove from Custom Filters");
    await customFilter.click();
    await expect(customFilter).toHaveText("Add to Custom Filters");
    await userSpan.click();
    await expect(ddContainer).not.toBeAttached();    
});

test("UserPopup mutates highlight-groups", async ({ page }) => {
    // check that popup renders and toggles correctly
    const userSpan = page.locator("li.sel>.fullpost span.user");
    await userSpan.click();
    const ddContainer = page.locator("div.userDropdown");
    const ddItems = ddContainer.locator(".dropdown__container .dropdown__item");

    // check that popup mutates highlight-groups
    const hgFriends = ddItems.nth(8).locator("span");
    await expect(hgFriends).toHaveText("Add to Highlights Group: Friends");
    await hgFriends.click();
    await expect(hgFriends).toHaveText("Remove from Highlights Group: Friends");
    await hgFriends.click();
    await expect(hgFriends).toHaveText("Add to Highlights Group: Friends");
    await userSpan.click();
    await expect(ddContainer).not.toBeAttached();
});
