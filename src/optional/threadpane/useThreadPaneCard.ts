import { useCallback, useEffect, useState } from "react";
import {
    collapsedPostEvent,
    hpnpJumpToPostEvent,
    pendingPostsUpdateEvent,
    processPostRefreshEvent,
    userFilterUpdateEvent,
} from "../../core/events";
import { CollapsedPostEventArgs, JumpToPostEventArgs, PendingPostEventArgs, PostEventArgs } from "../../core/events.d";
import { enabledContains, getEnabledSuboption } from "../../core/settings";
import type { PendingPost } from "../highlightpending";
import { ResolvedUser } from "../highlight_users";
import { getRecents, jumpToPost, threadContainsLoggedUser } from "./helpers";
import type { ParsedPost, ParsedReply } from "./index.d";

const useThreadPaneCard = (post: ParsedPost) => {
    const [localPost, setLocalPost] = useState(post);
    const { recents, rootid } = localPost || {};

    const [pending, setPending] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [refreshed, setRefreshed] = useState(false);
    const [localRecents, setLocalRecents] = useState(recents);

    const handleClickReload = useCallback(() => {
        const reloadBtn = document.querySelector(`.root#root_${rootid}>ul>li .refresh>a`) as HTMLElement;
        if (reloadBtn) {
            reloadBtn.click();
            setRefreshed(true);
            setTimeout(() => setRefreshed(false), 333);
        }
    }, [rootid]);
    const handleClickThreadShortcut = useCallback(
        (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
            e?.preventDefault();
            e?.stopPropagation();
            jumpToPost({
                rootid,
                options: { cardFlash: true, postFlash: true, scrollPost: true, toFit: true, collapsed },
            });
        },
        [rootid, collapsed],
    );
    const handleCardClick = useCallback(() => {
        const _mostRecent = localRecents?.mostRecentRef;
        const _nearestLi = (_mostRecent?.parentNode as HTMLElement)?.closest("li");
        const postid = parseInt(_nearestLi?.id?.substr(5));
        jumpToPost({
            postid,
            rootid,
            options: { cardFlash: true, postFlash: true, scrollPost: true, uncap: true, collapsed },
        });
    }, [localRecents, collapsed, rootid]);
    const handleJumpToPost = useCallback(
        (args: JumpToPostEventArgs) => {
            const { threadid } = args || {};
            jumpToPost({
                rootid: threadid,
                options: { cardFlash: true, postFlash: true, scrollParent: true, collapsed },
            });
        },
        [collapsed],
    );

    const updateCollapsed = useCallback(
        (args: CollapsedPostEventArgs) => {
            const { threadid, is_collapsed } = args || {};
            if (threadid === rootid && is_collapsed) setCollapsed(true);
            else if (threadid === rootid && !is_collapsed) setCollapsed(false);
        },
        [rootid],
    );
    const updatePending = useCallback(
        (args: PendingPostEventArgs) => {
            const { pendings } = args || {};
            // highlight this post if HPP flags the thread
            if (pending) return;
            const foundIdx = pendings?.findIndex((p: PendingPost) => p.threadId === rootid);
            if (foundIdx > -1) setPending(true);
        },
        [pending, rootid],
    );

    const refreshedThread = useCallback(
        (args: PostEventArgs) => {
            const { rootid: threadid } = args || {};
            if (threadid === rootid) {
                setPending(false);
                const threadRoot = document.querySelector(`div.root#root_${rootid}`) as HTMLElement;
                const newRecents = threadRoot && getRecents(threadRoot as HTMLElement);
                if (newRecents) setLocalRecents(newRecents);
                threadContainsLoggedUser(threadRoot).then((contained) => {
                    // update our "user replied" state for this thread
                    if (contained) setLocalPost({ ...localPost, contained });
                });
            }
        },
        [rootid, localPost],
    );

    const userFilterUpdate = useCallback(
        (args: ResolvedUser) => {
            const { username: filteredUser } = args || {};
            (async () => {
                const cufEnabled = await enabledContains(["custom_user_filters"]);
                const removeFullposts = cufEnabled && (await getEnabledSuboption("cuf_hide_fullposts"));
                const filterToLower = filteredUser.toLowerCase();
                const userMatches = localPost?.author?.toLowerCase() === filterToLower;
                if (removeFullposts && userMatches) setLocalPost(null);
                else if (!removeFullposts && userMatches) setLocalRecents(null);
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

    useEffect(() => {
        collapsedPostEvent.addHandler(updateCollapsed);
        pendingPostsUpdateEvent.addHandler(updatePending);
        processPostRefreshEvent.addHandler(refreshedThread);
        userFilterUpdateEvent.addHandler(userFilterUpdate);
        hpnpJumpToPostEvent.addHandler(handleJumpToPost);
        return () => {
            collapsedPostEvent.removeHandler(updateCollapsed);
            pendingPostsUpdateEvent.removeHandler(updatePending);
            processPostRefreshEvent.removeHandler(refreshedThread);
            userFilterUpdateEvent.removeHandler(userFilterUpdate);
            hpnpJumpToPostEvent.removeHandler(handleJumpToPost);
        };
    }, [updatePending, refreshedThread, userFilterUpdate, updateCollapsed, handleJumpToPost]);

    return {
        collapsed,
        handleClickReload,
        handleClickThreadShortcut,
        handleCardClick,
        localPost,
        localRecents,
        pending,
        refreshed,
    };
};
export { useThreadPaneCard };
