import { test, expect, navigate } from "../fixtures";

test("UserPopup assorted interactions", async ({ page }) => {
  await navigate(
    page,
    "https://www.shacknews.com/chatty?id=40148393#item_40148393"
  );

  // check that popup renders and toggles correctly
  const userSpan = page.locator("li.sel>.fullpost span.user");
  await userSpan.click();
  const ddContainer = page.locator("div.userDropdown");
  const ddItems = ddContainer.locator(".dropdown__container .dropdown__item");
  await expect(ddItems.nth(0).locator("span")).toContainText("shirif's Posts");
  await userSpan.click();
  await expect(ddContainer).not.toBeAttached();

  // check that popup mutates custom-filters
  await userSpan.click();
  const customFilter = ddItems.nth(7).locator("span");
  await expect(customFilter).toHaveText("Add to Custom Filters");
  await customFilter.click();
  await expect(customFilter).toHaveText("Remove from Custom Filters");
  await customFilter.click();
  await expect(customFilter).toHaveText("Add to Custom Filters");
  await userSpan.click();

  // check that popup mutates highlight-groups
  await userSpan.click();
  const hgFriends = ddItems.nth(8).locator("span");
  await expect(hgFriends).toHaveText("Add to Highlights Group: Friends");
  await hgFriends.click();
  await expect(hgFriends).toHaveText("Remove from Highlights Group: Friends");
  await hgFriends.click();
  await expect(hgFriends).toHaveText("Add to Highlights Group: Friends");
  await userSpan.click();
  await expect(ddContainer).not.toBeAttached();
});
