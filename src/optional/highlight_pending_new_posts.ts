import { TP_Instance } from "../content";
import { arrHas, scrollParentToChild, scrollToElement } from "../core/common";
import { processNotifyEvent, processPostRefreshEvent } from "../core/events";
import type { NotifyEvent, NotifyResponse } from "../core/notifications";
import { getEventId } from "../core/notifications";
import { ChromeShack } from "../core/observers";
import { enabledContains } from "../core/settings";

export interface PendingPost {
    postId: number;
    threadId: number;
    thread: HTMLElement;
}

export const HighlightPendingPosts = {
    lastEventId: 0,

    lastIndex: -1,

    refreshed: null as HTMLElement,

    pendings: [] as PendingPost[],

    marked: [] as HTMLElement[],

    async install() {
        const is_enabled = await enabledContains(["highlight_pending_new_posts"]);
        if (is_enabled) HighlightPendingPosts.apply();
    },

    updatePendings() {
        for (const pending of HighlightPendingPosts.pendings || []) {
            const a = pending.thread?.querySelector(`.fullpost .refresh a`);
            if (a) a.classList.add("refresh_pending");
        }
        HighlightPendingPosts.updateJumpToNewPostButton();
        // if the Thread Pane script is loaded, then refresh the thread pane
        if (TP_Instance.isEnabled) TP_Instance.apply();
    },

    fetchPendings(resp: NotifyResponse) {
        if (arrHas(resp.events)) {
            HighlightPendingPosts.lastEventId = resp.lastEventId;
            const newPosts = [...resp.events.filter((x: NotifyEvent) => x.eventType === "newPost")];
            const newPendingEvents = [];
            for (const e of newPosts) {
                const postId = e?.eventData?.postId;
                const threadId = e?.eventData?.post?.threadId;
                const thread = document.querySelector(`li#item_${threadId}`) as HTMLElement;
                // skip over threads already in our stack or threads that don't exist in the DOM
                if (HighlightPendingPosts.pendings.find((x) => x.threadId === threadId) || !thread) continue;
                newPendingEvents.push({ postId, threadId, thread } as PendingPost);
            }
            if (arrHas(newPendingEvents)) {
                const mutated = ([...HighlightPendingPosts.pendings, newPendingEvents] as PendingPost[]).flat();
                if (ChromeShack.debugEvents)
                    console.log(
                        "HighlightPendingPosts fetchPendings:",
                        mutated,
                        HighlightPendingPosts.pendings,
                        HighlightPendingPosts.lastIndex,
                    );

                HighlightPendingPosts.pendings = mutated;
                HighlightPendingPosts.updatePendings();
            }
        }
    },

    isCollapsed(elem: HTMLElement) {
        return elem?.closest("div.root.collapsed");
    },

    isPending(elem: HTMLElement) {
        return elem?.matches("a.refresh_pending") && elem?.closest("div.refresh a") === elem;
    },

    excludeRefreshed(refreshElem: HTMLElement) {
        if (!refreshElem) return;
        const closestId = parseInt(refreshElem?.closest("li[id^='item_']")?.id?.substr(5));
        const mutated = [
            ...HighlightPendingPosts.pendings.filter((x) => x.postId !== closestId || x.threadId !== closestId),
        ];
        HighlightPendingPosts.pendings = mutated;
        const _index = HighlightPendingPosts.lastIndex;
        // bump our position in the stack back one when we update our pendings
        HighlightPendingPosts.lastIndex = _index - 1 > 0 ? _index - 1 : 0;
        if (ChromeShack.debugEvents)
            console.log(
                "HighlightPendingPosts excludeRefreshed:",
                HighlightPendingPosts.pendings,
                HighlightPendingPosts.lastIndex,
            );
    },
    getNonCollapsedPendings(refreshElem: HTMLElement) {
        HighlightPendingPosts.excludeRefreshed(refreshElem);
        const pendings = [...document.querySelectorAll("a.refresh_pending")];
        const filtered = [] as HTMLElement[];
        for (const pending of pendings) {
            const _pending = pending as HTMLElement;
            const post = _pending?.closest("li[id^='item_']") as HTMLElement;
            // include only non-refreshed/non-collapsed pending posts
            if (HighlightPendingPosts.isPending(_pending) && !HighlightPendingPosts.isCollapsed(_pending))
                filtered.push(post);
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
            const divPostItem = HighlightPendingPosts.marked[newIndex] as HTMLElement;
            const postId = divPostItem?.id?.substr(5);
            const csPane = document.querySelector("#cs_thread_pane") as HTMLElement;
            const tpCard = csPane?.querySelector(`div[id='${postId}']`) as HTMLElement;
            scrollToElement(divPostItem);
            // also scroll to the card on the ThreadPane (if enabled)
            if (tpCard) scrollParentToChild(csPane, tpCard);
            HighlightPendingPosts.lastIndex = newIndex;
        });
        starContainer.appendChild(star);
        position.appendChild(starContainer);
    },

    updateJumpToNewPostButton() {
        const button = document.getElementById("post_highlighter_container");
        const indicator = "★ ";
        const titleHasIndicator = document.title.startsWith(indicator);
        const pendingPostBtn = document.getElementById("jump_to_new_post");
        HighlightPendingPosts.getNonCollapsedPendings(HighlightPendingPosts.refreshed);
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
        processPostRefreshEvent.addHandler((post: HTMLElement) => {
            HighlightPendingPosts.refreshed = post;
            HighlightPendingPosts.updatePendings();
            HighlightPendingPosts.updateJumpToNewPostButton();
        });
        getEventId().then((id) => {
            HighlightPendingPosts.lastEventId = id;
            processNotifyEvent.addHandler(HighlightPendingPosts.fetchPendings);
        });
    },
};
