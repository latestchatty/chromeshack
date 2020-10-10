import { useCallback, useState } from "react";
import { elementFitsViewport, scrollParentToChild, scrollToElement } from "../../core/common";
import { enabledContains, getEnabledSuboption } from "../../core/settings";
import type { PendingPost } from "../highlightpending";
import { flashCard, flashPost, getRecents } from "./helpers";
import type { ParsedPost, ParsedReply } from "./index.d";

const useThreadPaneCard = (post: ParsedPost) => {
    const [pending, setPending] = useState(false);
    const [localPost, setLocalPost] = useState(post);
    const { recents, rootid } = localPost || {};
    const [localRecents, setLocalRecents] = useState(recents);

    const handleClickThreadShortcut = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e?.preventDefault();
            e?.stopPropagation();
            const thread = document.querySelector(`div.root > ul > li#item_${rootid}`);
            // scroll the root fullpost into full view
            if (thread) scrollToElement(thread as HTMLElement, true);
        },
        [rootid],
    );
    const handleCardClick = useCallback(() => {
        const _mostRecent = localRecents?.mostRecentRef;
        const _nearestLi = (_mostRecent?.parentNode as HTMLElement)?.closest("li");
        const postid = _nearestLi?.id?.substr(5);

        const liElem = postid && (document.querySelector(`li#item_${postid}`) as HTMLLIElement);
        const divRoot = rootid && (document.querySelector(`div.root#root_${rootid}`) as HTMLDivElement);
        const card = rootid && (document.querySelector(`div#item_${rootid}`) as HTMLDivElement);
        if (divRoot && liElem && card) {
            // uncap the root thread
            if (divRoot?.classList?.contains("capped")) divRoot.classList.remove("capped");
            // try to fit the whole rootpost in view or scroll to the reply
            if (elementFitsViewport(divRoot)) scrollToElement(divRoot, true);
            else scrollToElement(liElem);
            flashPost(divRoot, liElem);
            flashCard(card);
        }
    }, [localRecents, rootid]);
    const handleJumpToPost = useCallback((threadId: number) => {
        const cardList = document.querySelector("div#cs_thread_pane") as HTMLElement;
        const card = document.querySelector(`#item_${threadId}.cs_thread_pane_card`) as HTMLElement;
        const divRoot = document.querySelector(`#root_${threadId}`) as HTMLDivElement;
        if (cardList && card) {
            scrollParentToChild(cardList, card);
            flashCard(card);
            flashPost(divRoot);
        }
    }, []);

    const updatePending = useCallback(
        (pendings: PendingPost[]) => {
            // highlight this post if HPP flags the thread
            if (pending) return;
            const foundIdx = pendings.findIndex((p: PendingPost) => p.threadId === rootid);
            if (foundIdx > -1) setPending(true);
        },
        [pending, rootid],
    );

    const refreshedThread = useCallback(
        (_1: any, _2: any, _3: any, threadid: string) => {
            const _threadid = parseInt(threadid) || 0;
            if (_threadid === rootid) {
                setPending(false);
                const threadRoot = document.querySelector(`div.root#root_${rootid}`);
                const newRecents = threadRoot && getRecents(threadRoot as HTMLElement);
                if (newRecents) setLocalRecents(newRecents);
            }
        },
        [rootid],
    );

    const userFilterUpdate = useCallback(
        (filteredUser: string) => {
            (async () => {
                const cufEnabled = await enabledContains(["custom_user_filters"]);
                const removeFullposts = cufEnabled && (await getEnabledSuboption("cuf_hide_fullposts"));
                const filterToLower = filteredUser.toLowerCase();
                if (removeFullposts && localPost?.author?.toLowerCase() === filterToLower) setLocalPost(null);
                else if (cufEnabled) {
                    const { recentTree } = localRecents || {};
                    const filteredRecents = [] as ParsedReply[];
                    // filter matching posts stopping on the first parent matched
                    for (const post of recentTree || [])
                        if (filterToLower === post.author.toLowerCase()) break;
                        else filteredRecents.push(post);
                    if (filteredRecents.length !== recentTree.length)
                        setLocalRecents({ ...localRecents, recentTree: filteredRecents });
                }
            })();
        },
        [localRecents, localPost],
    );
    return {
        handleClickThreadShortcut,
        handleCardClick,
        handleJumpToPost,
        updatePending,
        refreshedThread,
        userFilterUpdate,
        localPost,
        localRecents,
        pending,
    };
};
export { useThreadPaneCard };
