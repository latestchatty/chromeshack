import { timeOverThresh } from "../core/common";
import { processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting, setSetting } from "../core/settings";

// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script

export const NewCommentHighlighter = {
    // 1 hour threshold
    timeout: 1000 * 60 * 60 * 1,

    async install() {
        await NewCommentHighlighter.highlight();
        processPostRefreshEvent.addHandler(NewCommentHighlighter.highlight);
    },

    async highlight(args?: PostEventArgs | void) {
        const { root } = args || {};
        const is_enabled = await enabledContains(["new_comment_highlighter"]);
        if (is_enabled) {
            const last_id = (await getSetting("new_comment_highlighter_last_id", -1)) as number;
            const overTimeout = await NewCommentHighlighter.checkTime(NewCommentHighlighter.timeout);
            const new_last_id = !overTimeout && NewCommentHighlighter.findLastID(root);
            if (last_id > -1 && new_last_id >= last_id) await NewCommentHighlighter.highlightPostsAfter(last_id, root);
            await NewCommentHighlighter.updateLastId(new_last_id);
            await NewCommentHighlighter.checkTime(null, true);
        }
    },

    async updateLastId(newid: number) {
        const last_id = (await getSetting("new_comment_highlighter_last_id", -1)) as number;
        if (newid > last_id) await setSetting("new_comment_highlighter_last_id", newid);
    },

    async checkTime(delayInMs: number, reset?: boolean) {
        const now = Date.now();
        const lastHighlightTime = (await getSetting("last_highlight_time", now)) as number;
        const overThresh = delayInMs ? timeOverThresh(lastHighlightTime, delayInMs) : now;
        if (reset || overThresh) {
            await setSetting("last_highlight_time", now);
            return true;
        } else return false;
    },

    async highlightPostsAfter(last_id: number, root?: HTMLElement) {
        // grab all the posts with post ids after the last post id we've seen
        const newer = [] as Element[];
        const oneliners = [...(root || document).querySelectorAll("li[id^='item_']")];
        const process = async (li: HTMLElement, i: number, arr: any[]) => {
            const is_newer = parseInt(li?.id?.substr(5)) >= last_id;
            const preview = li.querySelector(".oneline_body");
            if (is_newer && !preview?.classList?.contains("newcommenthighlighter")) {
                preview.classList.add("newcommenthighlighter");
                newer.push(li);
            }
            if (i === arr.length - 1) {
                // update our "Comments ..." blurb at the top of the thread list
                let commentDisplay = document.getElementById("chatty_settings");
                if (commentDisplay) commentDisplay = commentDisplay.childNodes[4] as HTMLElement;
                const commentsCount = commentDisplay?.textContent?.split(" ")[0];
                const newComments = commentsCount && `${commentsCount} Comments (${newer.length} New)`;
                if (newComments) commentDisplay.textContent = newComments;
            }
        };
        await Promise.all(oneliners.map(process));
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
