import { faAngleDoubleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { arrHas, classNames } from "../../core/common";
import {
    collapsedPostEvent,
    hpnpJumpToPostEvent,
    pendingPostsUpdateEvent,
    processPostRefreshEvent,
    userFilterUpdateEvent,
} from "../../core/events";
import { parsePosts } from "./helpers";
import type { ParsedPost, ParsedReply, Recents } from "./index.d";
import { useThreadPaneCard } from "./useThreadPaneCard";

const StepForwardIcon = () => <FontAwesomeIcon icon={faAngleDoubleRight} />;

const ThreadPaneReply = (props: { recent: ParsedReply; mostRecent?: boolean }) => {
    const { recent, mostRecent } = props || {};
    const { author, body } = recent || {};

    return (
        <div className={classNames("cs_thread_pane_reply", { reply_most_recent: mostRecent })}>
            <div className="cs_thread_pane_reply_arrow">↪</div>
            <div className="cs_thread_pane_reply_preview">{body}</div>
            <div className="cs_thread_pane_reply_divider">:</div>
            <div className="cs_thread_pane_reply_author">{author}</div>
        </div>
    );
};

const ThreadPaneReplies = (props: { recents: Recents }) => {
    const { recents: parents } = props || {};
    const { recentTree: recents } = parents || {};

    return recents ? (
        <div className="cs_thread_pane_replies">
            {recents?.map((r, i) => {
                return <ThreadPaneReply key={i} recent={r} mostRecent={i === recents.length - 1} />;
            })}
        </div>
    ) : null;
};

const ThreadPaneCard = (props: { post: ParsedPost }) => {
    const { post } = props || {};
    const {
        handleClickThreadShortcut,
        handleCardClick,
        handleJumpToPost,
        updatePending,
        refreshedThread,
        userFilterUpdate,
        localPost,
        localRecents,
        pending,
        collapsed,
        updateCollapsed,
    } = useThreadPaneCard(post);
    const { author, body, count, mod, rootid } = localPost || {};

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

    return localPost?.rootid ? (
        <div
            className={classNames("cs_thread_pane_card", `cs_thread_pane_card_${mod}`, {
                cs_thread_pane_card_refresh_pending: pending,
                collapsed: collapsed,
            })}
            id={`item_${rootid.toString()}`}
            onClick={handleCardClick}
        >
            <div className="cs_thread_pane_card_header">
                <div className="cs_thread_pane_root_author">{author}</div>
                <div className="cs_thread_pane_post_count">{count > 0 && `${count} posts`}</div>
                <div className="cs_thread_pane_shortcut" title="Jump to thread" onClick={handleClickThreadShortcut}>
                    <StepForwardIcon />
                </div>
            </div>
            <div className="cs_thread_pane_root_body" dangerouslySetInnerHTML={{ __html: body }} />
            {!collapsed && <ThreadPaneReplies recents={localRecents} />}
        </div>
    ) : null;
};

const ThreadPaneApp = (props: { threadsElem: HTMLElement }) => {
    const { threadsElem } = props || {};
    const [parsed, setParsed] = useState([] as ParsedPost[]);

    useEffect(() => {
        const _parsed = parsePosts(threadsElem);
        if (arrHas(_parsed)) setParsed(_parsed);
    }, [threadsElem]);

    return arrHas(parsed) ? (
        <div id="cs_thread_pane_list">
            {parsed.map((p, i) => (
                <ThreadPaneCard key={i} post={p} />
            ))}
        </div>
    ) : null;
};

export { ThreadPaneApp };
