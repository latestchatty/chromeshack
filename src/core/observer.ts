import { elemMatches, locatePostRefs } from "./common";
import { processReplyEvent } from "./events";
import type { RefreshMutation } from "./index.d";
import { setUsername } from "./notifications";
import {
    handleRefreshClick,
    handleReplyAdded,
    handleRootAdded,
    processFullPosts,
    processObserverInstalled,
    processPost,
    processPostBox,
} from "./observer_handlers";

export const ChromeShack = {
    refreshing: [] as RefreshMutation[],

    install() {
        // set our current logged-in username once upon refreshing the Chatty
        const loggedInUsername = document.getElementById("user_posts")?.innerText || "";
        if (loggedInUsername) setUsername(loggedInUsername);

        // use MutationObserver instead of Mutation Events for a massive performance boost
        const observer_handler = (mutationsList: MutationRecord[]) => {
            try {
                //console.log("mutation:", mutationsList);
                for (const mutation of mutationsList) {
                    const lastMutatedSibling = mutation.previousSibling as HTMLElement;
                    const lastRemoved = mutation.removedNodes[0] as HTMLElement;
                    const mutated = mutation.target as HTMLElement;
                    // flag indicated the user has triggered a fullpost reply
                    if (elemMatches(lastMutatedSibling, ".fullpost") && elemMatches(lastRemoved, ".inlinereply")) {
                        const parent =
                            elemMatches(mutated, "li[id^='item_']") ||
                            (mutated?.closest && (mutated.closest("li[id^='item_'].sel.last") as HTMLElement));
                        const parentid = parseInt(parent?.id?.substr(5));
                        const root = parent?.closest && (parent.closest("div.root > ul > li") as HTMLElement);
                        const rootid = parseInt(root?.id?.substr(5));
                        const foundIdx = ChromeShack.refreshing.findIndex((r) => r.rootid === rootid);
                        // track our reply mutation based on the root thread id (like a refresh)
                        if (foundIdx === -1) ChromeShack.refreshing.unshift({ parentid, rootid });
                    }

                    for (const addedNode of mutation.addedNodes || []) {
                        const added = addedNode as HTMLElement;
                        const addedParent = added?.parentNode as HTMLElement;
                        if (elemMatches(added, "div.root")) {
                            // check for a thread replacement (refresh or reply)
                            const rootid = parseInt(added?.id?.substr(5));
                            const foundMutation = ChromeShack.refreshing.find((r) => r.rootid === rootid);
                            if (foundMutation) handleRootAdded(foundMutation);
                        }
                        if (elemMatches(addedParent, "li[id^='item_']")) {
                            // check for opening a fullpost
                            const refs = locatePostRefs(addedParent);
                            processPost(refs);
                        }
                        if (elemMatches(added, "#postbox")) processPostBox(added);
                    }
                }
            } catch (e) {
                console.error("A problem occurred when processing a post:", e);
            }
        };
        const observer = new MutationObserver(observer_handler);
        observer.observe(document, {
            characterData: true,
            subtree: true,
            childList: true,
        });

        processObserverInstalled();
        document.addEventListener("click", handleRefreshClick);
        processReplyEvent.addHandler(handleReplyAdded);

        processFullPosts();
    },
};
