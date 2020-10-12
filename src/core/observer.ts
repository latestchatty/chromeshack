import { elemMatches, locatePostRefs } from "./common";
import { setUsername } from "./notifications";
import {
    handleRefreshClick,
    handleReplyAdded,
    processFullPosts,
    processObserverInstalled,
    processPost,
    processPostBox,
} from "./observer_handlers";

export const ChromeShack = {
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
                        const target = mutated?.closest && (mutated.closest("li[id^='item_']") as HTMLElement);
                        const parentId = parseInt(target?.id?.substr(5));
                        handleReplyAdded(parentId);
                    }

                    for (const addedNode of mutation.addedNodes || []) {
                        const added = addedNode as HTMLElement;
                        const addedParent = added?.parentNode as HTMLElement;
                        // reply/refresh = added?.matches("div.root")
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

        processFullPosts();
    },
};
