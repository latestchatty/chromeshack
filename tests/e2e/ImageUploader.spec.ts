import path from "node:path";
import { test, expect, navigate } from "../fixtures";

const url = "https://www.shacknews.com/chatty?id=40056583#item_40056583";

test.describe("Image Uploader", () => {
  test("toggle state persistence", async ({ page, context }) => {
    await navigate(page, url, undefined, context);

    const replyBtn = page.locator("li.sel div.reply>a");
    await replyBtn.click();
    // test state persistence through toggle and page reload
    const uploadToggle = page.locator("li.sel #uploader-toggle");
    await uploadToggle.click();
    const uploader = page.locator("li.sel #uploader-container");
    await expect(uploader).toBeVisible();
    await replyBtn.click({ clickCount: 2, delay: 250 });
    await expect(uploader).toBeVisible();
    await page.reload();
    await replyBtn.click();
    await expect(uploader).toBeVisible();
  });
  test("url detection and input state transition", async ({ page, context }) => {
    await navigate(page, url, undefined, context);

    const replyBtn = page.locator("li.sel div.reply>a");
    await replyBtn.click();
    const uploaderToggleBtn = page.locator("div#uploader-toggle");
    await uploaderToggleBtn.click();
    const urlInput = page.locator("li.sel input#urlinput");
    // test invalid url detection
    const invalidInput = "https://localhost/test.jpeg";
    await urlInput.fill(invalidInput);
    const urlInputInvalid = await urlInput.evaluate((e) => (e as HTMLInputElement).validity.patternMismatch);
    expect(urlInputInvalid).toBeTruthy();
    // generically invalid urls should disable the upload button
    const uploadBtn = page.locator("li.sel button#upload-btn");
    await expect(uploadBtn).toBeDisabled();
    // test valid url detection
    await urlInput.clear();
    const validInput = "https://a.io/test.mp4";
    await urlInput.fill(validInput);
    const urlInputValid = await urlInput.evaluate((e) => (e as HTMLInputElement).validity.valid);
    expect(urlInputValid).toBeTruthy();
    await expect(uploadBtn).toBeEnabled();
    // test button interactions on valid input
    const dropArea = page.locator("li.sel div#dropArea");
    const cancelBtn = page.locator("li.sel button#cancel-btn");
    await cancelBtn.click();
    await expect(uploadBtn).toBeDisabled();
    await expect(dropArea).not.toHaveClass(/disabled/);
    // test input state persistence through postbox toggle
    await replyBtn.click({ clickCount: 2, delay: 250 });
  });
  test("file drop input and state transitions", async ({ page, context }) => {
    await navigate(page, url, undefined, context);

    const replyBtn = page.locator("li.sel div.reply>a");
    await replyBtn.click();
    const uploaderToggleBtn = page.locator("div#uploader-toggle");
    await uploaderToggleBtn.click();
    const fileInput = page.locator("li.sel input#fileChooser");
    await fileInput.setInputFiles([
      path.resolve("./tests/fixtures/arcade1.jpg"),
      path.resolve("./tests/fixtures/arcade2.jpg"),
    ]);
    await expect(page.locator("li.sel .drop__area--icon")).toBeHidden();
    const dropArea = page.locator("li.sel div#dropArea");
    await expect(dropArea).toHaveClass(/disabled/);
    const uploadBtn = page.locator("li.sel button#upload-btn");
    await expect(uploadBtn).toBeEnabled();
    // cancelling before uploading resets interface state
    const cancelBtn = page.locator("li.sel button#cancel-btn");
    await cancelBtn.click();
    await expect(uploadBtn).toBeDisabled();
    await expect(dropArea).not.toHaveClass(/disabled/);
  });
});
