import { browser } from "webextension-polyfill-ts";

import { enabledContains } from "../core/settings";
import { processPostRefreshEvent } from "../core/events";
import { fetchSafe, scrollToElement } from "../core/common";
import { TP_Instance, CS_Instance } from "../content";

import type { NotifyEvent, NotifyResponse } from "../core/notifications";

interface PendingPost {
    postId: number;
    threadId: number;
}

const HighlightPendingPosts = {
    lastEventId: 0,

    lastIndex: -1,

    pendings: [] as PendingPost[],

    marked: [] as HTMLElement[],

    async install() {
        const is_enabled = await enabledContains("highlight_pending_new_posts");
        if (is_enabled) HighlightPendingPosts.apply();
    },

    updatePendings(refreshElem?: HTMLElement) {
        for (const pending of HighlightPendingPosts.pendings || []) {
            // Received an event for a post we already have.
            if (document.getElementById(`item_${pending.postId}`)) continue;
            const a = document.querySelector(`li#item_${pending.threadId} div.fullpost div.refresh a`);
            if (a) a.classList.add("refresh_pending");
        }
        HighlightPendingPosts.updateJumpToNewPostButton(refreshElem);
        // if the Thread Pane script is loaded, then refresh the thread pane
        if (TP_Instance.isEnabled) TP_Instance.apply();
    },

    fetchPendings() {
        browser.runtime
            .sendMessage({
                name: "corbFetch",
                url: `https://winchatty.com/v2/pollForEvent?lastEventId=${HighlightPendingPosts.lastEventId}`,
            })
            .then((json: NotifyResponse) => {
                // sanitized in common.js!
                if (json.events) {
                    HighlightPendingPosts.lastEventId = json.lastEventId;
                    const newPosts = [...json.events.filter((x: NotifyEvent) => x.eventType === "newPost")];
                    const newPendingEvents = [];
                    for (const post of newPosts) {
                        newPendingEvents.push({
                            postId: post.eventData.postId,
                            threadId: post.eventData.post.threadId,
                        } as PendingPost);
                    }
                    // Short delay in between loop iterations.
                    setTimeout(HighlightPendingPosts.fetchPendings, 5000);
                }
            });
    },

    excludeRefreshed(refreshElem: HTMLElement) {
        if (!refreshElem) return;
        const closestId = parseInt(refreshElem?.closest("li[id^='item_']")?.id?.substr(5));
        const mutated = [
            ...HighlightPendingPosts.pendings.filter((x) => x.postId !== closestId || x.threadId !== closestId),
        ];
        HighlightPendingPosts.pendings = mutated;
    },

    isCollapsed(elem: HTMLElement) {
        return elem?.closest("div.root.collapsed");
    },

    isPending(elem: HTMLElement) {
        return elem?.matches("a.refresh_pending") && elem?.closest("div.refresh a") === elem;
    },

    getNonCollapsedPendings(refreshElem?: HTMLElement) {
        HighlightPendingPosts.excludeRefreshed(refreshElem);
        const pendings = [...document.querySelectorAll("a.refresh_pending")];
        const filtered = [] as HTMLElement[];
        for (const pending of pendings) {
            const _pending = pending as HTMLElement;
            // include only non-refreshed/non-collapsed pendings
            if (HighlightPendingPosts.isPending(_pending) && !HighlightPendingPosts.isCollapsed(_pending))
                filtered.push(_pending);
        }
        HighlightPendingPosts.marked = filtered;
    },

    installJumpToNewPostButton() {
        const position = document.querySelector(".header-bottom .logo.alt");
        const starContainer = document.createElement("div");
        const star = document.createElement("a");
        starContainer.setAttribute("id", "post_highlighter_container");
        starContainer.classList.add("hidden");
        star.setAttribute("id", "jump_to_new_post");
        star.addEventListener("click", (e) => {
            e.preventDefault();
            // simple incrementing carousel
            const pendingLen = HighlightPendingPosts.marked.length;
            const newIndex = (HighlightPendingPosts.lastIndex + 1 + pendingLen) % pendingLen;
            const divPostItem = HighlightPendingPosts.marked[newIndex]?.closest("li[id^='item_']") as HTMLElement;
            scrollToElement(divPostItem);
            HighlightPendingPosts.lastIndex = newIndex;
        });
        starContainer.appendChild(star);
        position.appendChild(starContainer);
    },

    updateJumpToNewPostButton(refreshElem?: HTMLElement) {
        const button = document.getElementById("post_highlighter_container");
        const indicator = "★ ";
        const titleHasIndicator = document.title.startsWith(indicator);
        const pendingPostBtn = document.getElementById("jump_to_new_post");
        HighlightPendingPosts.getNonCollapsedPendings(refreshElem);
        if (HighlightPendingPosts.marked.length > 0) {
            if (button) button.classList.remove("hidden");
            if (!titleHasIndicator) document.title = indicator + document.title;
            pendingPostBtn.innerText = indicator + HighlightPendingPosts.marked.length.toString();
        } else {
            if (button) button.classList.add("hidden");
            if (titleHasIndicator) document.title = document.title.substring(indicator.length);
        }
    },

    apply() {
        // Only install on the main /chatty page, not an individual thread.
        if (!document.getElementById("newcommentbutton")) return;
        // Only install on the first page of the chatty.
        const aSelectedPage = document.querySelector("a.selected_page") as HTMLLinkElement;
        const pageMatch = aSelectedPage && /page=(\d+)$/i.exec(aSelectedPage.href);
        if (pageMatch && pageMatch[1] !== "1") return;
        HighlightPendingPosts.installJumpToNewPostButton();
        // Recalculate the "jump to new post" button's visibility when the user refreshes/toggles a thread
        processPostRefreshEvent.addHandler((refreshElem: HTMLElement) => {
            HighlightPendingPosts.updatePendings();
            HighlightPendingPosts.updateJumpToNewPostButton(refreshElem);
        });
        // We need to get an initial event ID to start with.
        browser.runtime
            .sendMessage({ name: "corbFetch", url: "https://winchatty.com/v2/getNewestEventId" })
            .then((json: { eventId: number }) => {
                // sanitized in common.js!
                HighlightPendingPosts.lastEventId = json.eventId;
                HighlightPendingPosts.fetchPendings();
            });
    },
};

export default HighlightPendingPosts;