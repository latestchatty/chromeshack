import { generatePreview, safeInnerHTML, scrollToElement } from "../core/common";
import { processPostBoxEvent } from "../core/events";
import { enabledContains } from "../core/settings";

export const PostPreview = {
    state: 0, // 0 = insert mode, 1 = preview mode

    previewTimer: null as ReturnType<typeof setTimeout>,

    async install() {
        const is_enabled = await enabledContains("post_preview");
        if (is_enabled) processPostBoxEvent.addHandler(PostPreview.apply);
    },

    apply(item: HTMLElement) {
        // script is already injected
        if (item.querySelector("#previewButton")) return;
        const postButton = item.querySelector("#frm_submit");
        const form_body = item.querySelector("#frm_body");
        if (!postButton || !form_body) return;
        const previewButton = document.createElement("button");
        previewButton.id = "previewButton";
        previewButton.setAttribute("type", "button");
        previewButton.textContent = "Preview";
        postButton.parentNode.insertBefore(previewButton, postButton.nextSibling);
        const previewArea = document.createElement("div");
        previewArea.id = "previewArea";
        previewArea.style.display = "none";
        form_body.parentNode.insertBefore(previewArea, form_body);
        PostPreview.installClickEvent(item);
    },

    replyToggleHandler(e: MouseEvent) {
        const this_node = e?.target as HTMLElement;
        const clickableTag = this_node?.matches("#shacktags_legend_table td > a");
        const replyBtn = this_node?.matches("div.reply > a");
        const closestPostbox = this_node?.closest("li.sel")?.querySelector("div.postbox") as HTMLElement;
        if (replyBtn && PostPreview.state === 1) PostPreview.enablePreview(closestPostbox);
        else if (clickableTag) PostPreview.updatePreview(e);
    },

    installClickEvent(item: HTMLElement) {
        const previewButton = <HTMLButtonElement>item.querySelector("#previewButton");
        document.removeEventListener("click", PostPreview.replyToggleHandler);
        document.addEventListener("click", PostPreview.replyToggleHandler);
        previewButton.removeEventListener("click", PostPreview.togglePreview);
        previewButton.addEventListener("click", PostPreview.togglePreview);
    },

    togglePreview(e: MouseEvent) {
        if (PostPreview.state === 0) {
            PostPreview.state = 1;
            PostPreview.enablePreview(e);
        } else {
            PostPreview.state = 0;
            PostPreview.disablePreview(e);
        }
    },

    enablePreview(e: MouseEvent | HTMLElement) {
        const this_node = (e instanceof MouseEvent
            ? (<HTMLElement>e?.target).closest("div.postbox")
            : e) as HTMLElement;
        const replyInput = this_node?.querySelector("#frm_body") as HTMLInputElement;
        const previewBox = this_node?.querySelector("#previewArea") as HTMLInputElement;
        if (!replyInput || !previewBox) return;
        previewBox.style.display = "block";
        PostPreview.delayedPreview(this_node);
        replyInput.addEventListener("input", PostPreview.updatePreview, true);
        replyInput.focus();
        scrollToElement(previewBox);
    },

    disablePreview(e: MouseEvent | HTMLElement) {
        const this_node = (e instanceof MouseEvent
            ? (<HTMLElement>e?.target).closest("div.postbox")
            : e) as HTMLElement;
        const replyInput = this_node?.querySelector("#frm_body") as HTMLInputElement;
        const previewBox = this_node?.querySelector("#previewArea") as HTMLInputElement;
        if (!replyInput || !previewBox) return;
        previewBox.style.display = "none";
        replyInput?.removeEventListener("input", PostPreview.updatePreview, true);
        replyInput?.focus();
        scrollToElement(replyInput);
    },

    updatePreview(e: Event | HTMLElement) {
        if (PostPreview.previewTimer) clearTimeout(PostPreview.previewTimer);
        PostPreview.previewTimer = setTimeout(() => PostPreview.delayedPreview(e), 250);
    },

    delayedPreview(e: Event | HTMLElement) {
        const this_node = e instanceof Event ? ((e?.target as HTMLElement).closest("div.postbox") as HTMLElement) : e;
        const replyInput = this_node?.matches("#frm_body")
            ? (this_node as HTMLInputElement)
            : (this_node?.querySelector("#frm_body") as HTMLInputElement);
        const previewBox = this_node?.matches("#previewArea")
            ? (this_node as HTMLDivElement)
            : (this_node?.querySelector("#previewArea") as HTMLDivElement);
        if (!replyInput || !previewBox || !this_node) return;
        safeInnerHTML(generatePreview(replyInput.value), previewBox);
    },
};
