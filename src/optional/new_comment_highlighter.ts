import { fullPostsCompletedEvent, processPostRefreshEvent } from "../core/events";
import { enabledContains, getSetting, setSetting } from "../core/settings";

// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script
export const NewCommentHighlighter = {
    date: new Date(),

    async install() {
        const is_enabled = await enabledContains(["new_comment_highlighter"]);
        if (is_enabled) {
            fullPostsCompletedEvent.addHandler(NewCommentHighlighter.highlight);
            processPostRefreshEvent.addHandler(NewCommentHighlighter.highlight);
        }
    },

    async highlight(args: { post: HTMLElement }) {
        const { post } = args || {};
        // only highlight if less than 2 hours have passed
        if (!(await NewCommentHighlighter.checkTime(1000 * 60 * 60 * 2))) {
            const last_id = (await getSetting("new_comment_highlighter_last_id")) as number;
            const new_last_id = NewCommentHighlighter.findLastID(post);
            if (last_id && new_last_id >= last_id) NewCommentHighlighter.highlightPostsAfter(last_id);
            // update with our current oldest id for the next check cycle
            if (!last_id || new_last_id >= last_id) await setSetting("new_comment_highlighter_last_id", new_last_id);
        }
        // reset our check time to avoid highlighting the whole page
        await NewCommentHighlighter.checkTime(null, true);
    },

    async checkTime(delayInMs: number, refresh?: boolean) {
        const curTime = NewCommentHighlighter.date.getTime();
        const lastHighlightTime = (await getSetting("last_highlight_time")) as number;
        const diffTime = lastHighlightTime && Math.abs(curTime - lastHighlightTime);
        if (refresh || !lastHighlightTime || (diffTime && diffTime > delayInMs)) {
            await setSetting("last_highlight_time", curTime);
            return true;
        }
        return false;
    },

    highlightPostsAfter(last_id: number) {
        const new_posts = NewCommentHighlighter.getPostsAfter(last_id);
        for (const post of new_posts || []) {
            const preview = post.querySelector(".oneline_body");
            if (preview && !preview.classList.contains("newcommenthighlighter"))
                preview.classList.add("newcommenthighlighter");
        }
        NewCommentHighlighter.displayNewCommentCount(new_posts?.length);
    },

    displayNewCommentCount(count: number) {
        if (count > 0) {
            let commentDisplay = document.getElementById("chatty_settings");
            commentDisplay = commentDisplay.childNodes[4] as HTMLElement;
            const commentsCount = commentDisplay?.textContent?.split(" ")[0];
            const newComments = commentsCount && `${commentsCount} Comments (${count} New)`;
            if (newComments) commentDisplay.textContent = newComments;
        }
    },

    getPostsAfter(last_id: number) {
        // grab all the posts with post ids after the last post id we've seen
        return [...document.querySelectorAll(".root > ul > li li[id^='item_']")].filter(
            (x) => parseInt(x?.id?.substr(5)) >= last_id,
        );
    },

    findLastID(post: HTMLElement) {
        // 'oneline0' is applied to highlight the most recent post in each thread
        // we only want the first one, since the top post will contain the most recent
        // reply.
        const mostRecent = (post || document).querySelector("div.oneline0");
        return mostRecent ? parseInt((<HTMLElement>mostRecent.parentNode)?.id?.substr(5)) : null;
    },
};
