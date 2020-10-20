import { useCallback, useEffect, useState } from "react";
import { PostEventArgs } from "../../core";
import { enabledContains, getEnabledSuboption, getSetting } from "../../core/settings";
import type { PendingPost } from "../highlightpending";
import { getRecents, jumpToPost } from "./helpers";
import type { ParsedPost, ParsedReply } from "./index.d";
import type { HighlightGroup } from "../../core/index.d";
import {
    collapsedPostEvent,
    hpnpJumpToPostEvent,
    pendingPostsUpdateEvent,
    processPostRefreshEvent,
    userFilterUpdateEvent,
} from "../../core/events";
import { cssStrToProps } from "../../core/common";

const useThreadPaneCard = (post: ParsedPost) => {
    const [localPost, setLocalPost] = useState(post);
    const { recents, rootid } = localPost || {};

    const [pending, setPending] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [localRecents, setLocalRecents] = useState(recents);
    const [cssProps, setCSSProps] = useState({});

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
        (threadid: number) => {
            jumpToPost({
                rootid: threadid,
                options: { cardFlash: true, postFlash: true, scrollParent: true, collapsed },
            });
        },
        [collapsed],
    );

    const updateCollapsed = useCallback(
        (threadid: number, is_collapsed: boolean) => {
            if (threadid === rootid && is_collapsed) setCollapsed(true);
            else if (threadid === rootid && !is_collapsed) setCollapsed(false);
        },
        [rootid],
    );
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
        ({ rootid: threadid }: PostEventArgs) => {
            if (threadid === rootid) {
                setPending(false);
                const threadRoot = document.querySelector(`div.root#root_${rootid}`);
                const newRecents = threadRoot && getRecents(threadRoot as HTMLElement);
                if (newRecents) setLocalRecents(newRecents);
            }
        },
        [rootid],
    );

    const highlightFilterUpdate = useCallback(() => {
        (async () => {
            const highlight_enabled = await enabledContains(["highlight_users"]);
            if (highlight_enabled) {
                const highlightGroups = (await getSetting("highlight_groups")) as HighlightGroup[];
                const localAuthorLower = localPost.author.toLowerCase();
                const foundHGs = highlightGroups?.filter(
                    (hg) => !!hg.users?.find((u) => u.toLowerCase() === localAuthorLower),
                );
                const css = foundHGs?.map((fhg) => fhg.css);
                const compiled = css.join(";").replace(/;+|;\s*/gm, ";");
                if (compiled) setCSSProps(cssStrToProps(compiled));
            }
        })();
    }, [localPost]);

    const userFilterUpdate = useCallback(
        (filteredUser: string) => {
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
        highlightFilterUpdate();
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
    }, [updatePending, refreshedThread, userFilterUpdate, updateCollapsed, handleJumpToPost, highlightFilterUpdate]);

    return {
        collapsed,
        handleClickThreadShortcut,
        handleCardClick,
        handleJumpToPost,
        cssProps,
        updatePending,
        refreshedThread,
        localPost,
        localRecents,
        pending,
        updateCollapsed,
        userFilterUpdate,
    };
};
export { useThreadPaneCard };
