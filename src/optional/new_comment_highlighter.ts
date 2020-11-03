import { fullPostsCompletedEvent, processPostRefreshEvent } from "../core/events";
import type { PostEventArgs } from "../core/events.d";
import { enabledContains, getSetting, setSetting } from "../core/settings";
import { elemMatches } from "../core/common";

// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script

export const NewCommentHighlighter = {
    // 2 hour timeout
    timeout: 1000 * 60 * 60 * 2,

    async install() {
        const is_enabled = await enabledContains(["new_comment_highlighter"]);
        if (is_enabled) {
            fullPostsCompletedEvent.addHandler(() => NewCommentHighlighter.highlight());
            processPostRefreshEvent.addHandler(NewCommentHighlighter.highlight);
        }
    },

    async highlight(args?: PostEventArgs) {
        const { root } = args || {};
        const last_id = (await getSetting("new_comment_highlighter_last_id", -1)) as number;
        const overTimeout = await NewCommentHighlighter.checkTime(NewCommentHighlighter.timeout);
        const new_last_id = !overTimeout && NewCommentHighlighter.findLastID(root);
        if (last_id > -1 && new_last_id >= last_id) NewCommentHighlighter.highlightPostsAfter(last_id, root);
        await NewCommentHighlighter.updateLastId(new_last_id);
        await NewCommentHighlighter.checkTime(null, true);
    },

    async updateLastId(newid: number) {
        const last_id = (await getSetting("new_comment_highlighter_last_id", -1)) as number;
        if (newid !== last_id) await setSetting("new_comment_highlighter_last_id", newid);
    },

    async checkTime(delayInMs: number, reset?: boolean) {
        const curTime = Date.now();
        const lastHighlightTime = (await getSetting("last_highlight_time", curTime)) as number;
        const diffTime = Math.abs(curTime - lastHighlightTime);
        if (reset || diffTime > delayInMs) {
            await setSetting("last_highlight_time", curTime);
            return true;
        } else return false;
    },

    highlightPostsAfter(last_id: number, root?: HTMLElement) {
        const new_posts = NewCommentHighlighter.getPostsAfter(last_id, root);
        for (const post of new_posts || []) {
            const preview = post.querySelector(".oneline_body");
            if (preview && !preview.classList.contains("newcommenthighlighter"))
                preview.classList.add("newcommenthighlighter");
        }
        if (new_posts?.length > 0) {
            // update our "Comments ..." blurb at the top of the thread list
            let commentDisplay = document.getElementById("chatty_settings");
            if (commentDisplay) commentDisplay = commentDisplay.childNodes[4] as HTMLElement;
            const commentsCount = commentDisplay?.textContent?.split(" ")[0];
            const newComments = commentsCount && `${commentsCount} Comments (${new_posts.length} New)`;
            if (newComments) commentDisplay.textContent = newComments;
        }
    },

    getPostsAfter(last_id: number, root?: HTMLElement) {
        // grab all the posts with post ids after the last post id we've seen
        return [...(root || document).querySelectorAll("li[id^='item_']")].filter((li) => {
            const root = elemMatches(li?.parentElement?.parentElement, "div.root");
            const is_root_newer = parseInt(root?.id?.substr(5)) >= last_id;
            const postid = parseInt(li?.id?.substr(5));
            // only include new replies and not new threads
            return !is_root_newer && postid >= last_id;
        });
    },

    findLastID(root: HTMLElement) {
        // 'oneline0' is applied to highlight the most recent post in each thread
        // we only want the first one, since the top post will contain the most recent
        // reply.
        const mostRecent = (root || document).querySelector("div.oneline0") as HTMLElement;
        const recentid = parseInt(mostRecent?.parentElement?.id?.substr(5));
        return recentid > -1 ? recentid : null;
    },
};
