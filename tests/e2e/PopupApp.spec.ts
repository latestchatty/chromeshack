import { test, expect } from "../fixtures";

test.describe("Settings Popup", () => {
  test.beforeEach(async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`);
  });

  test("Toggle persistence", async ({ page }) => {
    await expect(page.locator("div.option__group > *")).toHaveCount(6);
    const options = page.locator("div.options");
    const autoOpenCheckbox = options.nth(2).locator("input#auto_open_embeds");
    await autoOpenCheckbox.click();
    await page.reload();
    await expect(autoOpenCheckbox).toBeChecked();
  });

  test("Test Tab Switching", async ({ page }) => {
    const tabs = page.locator("button.tab__btn");
    // click Notify Tab and enable notify
    await tabs.nth(1).click();
    const notifyEnablement = page.locator("input#enable_notifications");
    await notifyEnablement.click();
    await expect(notifyEnablement).toBeChecked();
    // click Filters tab confirm highlight groups has default # of children
    await tabs.nth(2).click();
    await expect(page.locator("div#highlight_groups > *")).toHaveCount(6);
    // click Notify tab again and disable notify
    await tabs.nth(1).click();
    await notifyEnablement.click();
    await expect(notifyEnablement).not.toBeChecked();
    // swap back to Filters tab and count children
    await tabs.nth(2).click();
    await expect(page.locator("div#highlight_groups > *")).toHaveCount(6);
    await page.waitForTimeout(250);
    // check if tab selection persists across reload
    await page.reload();
    await expect(page.locator("button.active")).toContainText("Filters");
  });

  test("Test HGs CSS Interactions", async ({ page }) => {
    const tabs = page.locator("button.tab__btn");
    // swap to Filters tab
    await tabs.nth(2).click();

    const opInputBox = page.locator("textarea#originalposter_css");
    const opCSSSplotch = page.locator("span#originalposter_splotch");
    // check for default CSS on OP HG
    await expect(opInputBox).toHaveValue("font-weight: bold; color: yellow;");
    await expect(opCSSSplotch).toHaveCSS("font-weight", "700");
    await expect(opCSSSplotch).toHaveCSS("color", "rgb(255, 255, 0)");
    // change CSS in text box and check reactivity on splotch
    await opInputBox.fill("font-weight: bold; color: cyan;");
    await page.waitForTimeout(500);
    await expect(opCSSSplotch).toHaveCSS("font-weight", "700");
    await expect(opCSSSplotch).toHaveCSS("color", "rgb(0, 255, 255)");

    // check Friends HG and reactivity
    const friendsInputBox = page.locator("textarea#friends_css");
    const friendsCSSSplotch = page.locator("span#friends_splotch");
    await expect(friendsInputBox).toHaveValue(
      "border: 1px dotted white !important;"
    );
    await expect(friendsCSSSplotch).toHaveCSS(
      "border",
      "1px dotted rgb(255, 255, 255)"
    );
    // change CSS and check for reactivity
    await friendsInputBox.fill(
      "border: 1px dotted white !important; color: magenta;"
    );
    await page.waitForTimeout(500);
    await expect(friendsCSSSplotch).toHaveCSS("color", "rgb(255, 0, 255)");

    // add/del some users to check common select box behavior
    const friendsSelectListBox = page.locator("select#friends_list_select_box");
    const friendsUserInputBox = page.locator("input#friends_list_text_box");
    const friendsAddBtn = page.locator("button#friends_list_add_btn");
    const friendsDelBtn = page.locator("button#friends_list_remove_btn");
    await friendsUserInputBox.fill("testuser1");
    await friendsAddBtn.click();
    await friendsUserInputBox.fill("testuser2");
    await friendsAddBtn.click();
    await friendsUserInputBox.fill("testuser3");
    await friendsAddBtn.click();
    const friendsOptions = friendsSelectListBox.locator("option");
    await expect(friendsOptions).toHaveCount(3);
    await friendsOptions.nth(1).click();
    await friendsDelBtn.click();
    await expect(friendsOptions).toHaveCount(2);
    await page.waitForTimeout(250);

    // check if settings persist across a reload
    await page.reload();
    await expect(friendsOptions).toHaveCount(2);
  });
});
