import jQuery from "jquery";
const $ = jQuery;

import { enabledContains } from "../core/settings";
import { elementFitsViewport, scrollToElement } from "../core/common";
import { processPostRefreshEvent } from "../core/events";

interface RecentPostSubtree {
    postAuthor: string;
    postPreviewHtml: string;
    postId: number;
}
export interface RecentPosts {
    parentIsRoot: boolean;
    mostRecentSubtree: RecentPostSubtree[];
}

const ThreadPane = {
    isEnabled: false,

    async install() {
        const is_enabled = await enabledContains("thread_pane");
        if (is_enabled) {
            try {
                ThreadPane.isEnabled = true;
                processPostRefreshEvent.addHandler(ThreadPane.apply);
                ThreadPane.apply();
            } catch (e) {
                console.error("Failed to install the thread_pane script:", e);
                $("div#cs_thread_pane").remove();
                $("body").removeClass("cs_thread_pane_enable");
            }
        }
    },

    apply() {
        // Only install on the main /chatty page, not an individual thread.
        if (document.getElementById("newcommentbutton") === null) return;

        $("body").addClass("cs_thread_pane_enable");

        const $pageDiv = $("div#page");

        // if an existing thread pane exists, then nuke it, but preserve the scroll position
        const $previousThreadPane = $("div#cs_thread_pane");
        let previousThreadPaneScrollTop = 0;
        if ($previousThreadPane.length > 0) {
            previousThreadPaneScrollTop = $("div#cs_thread_pane").scrollTop();
            $("div#cs_thread_pane").remove();
        }

        // create the thread pane container
        const $threadPaneDiv = $('<div id="cs_thread_pane">');
        $pageDiv.append($threadPaneDiv);
        const $listDiv = $('<div id="cs_thread_pane_list">');
        $threadPaneDiv.append($listDiv);

        // walk the thread list and collect the posts
        for (const threadDiv of $("div#chatty_comments_wrap div.root")) {
            const $threadDiv = $(threadDiv);
            const threadId = ThreadPane.parseThreadId($threadDiv);

            const $opDiv = $($threadDiv.find("ul li div.fullpost")[0]) as JQuery<HTMLElement>;

            const rootAuthor = ThreadPane.parseRootAuthor($opDiv);
            const $rootBodyDiv = ThreadPane.cloneRootPostBody($opDiv, threadId) as JQuery<HTMLElement>;

            // skip this root post if it contains no data
            if (rootAuthor.length === 0 || $rootBodyDiv[0].innerText.length === 0) continue;

            const rootBodyHtml = ThreadPane.getHtmlWithTrimmedLineBreaks($rootBodyDiv);
            const postCount = ThreadPane.parseThreadPostCount($threadDiv);
            const { parentIsRoot, mostRecentSubtree } = ThreadPane.parseMostRecentPosts($threadDiv, threadId);
            const isRefreshPending = $opDiv.find(".refresh_pending").length > 0;

            // begin constructing the thread summary card in the thread pane
            const $cardDiv = $('<div class="cs_thread_pane_card">').attr("id", threadId);
            $cardDiv.append(
                $('<div class="cs_thread_pane_post_count">').text(`${postCount} post${postCount === 1 ? "" : "s"}`),
            );
            $cardDiv.append($('<div class="cs_thread_pane_root_author">').text(rootAuthor));

            if (isRefreshPending) $cardDiv.addClass("cs_thread_pane_card_refresh_pending");
            else if ($opDiv.hasClass("fpmod_nws")) $cardDiv.addClass("cs_thread_pane_card_nws");
            else if ($opDiv.hasClass("fpmod_informative")) $cardDiv.addClass("cs_thread_pane_card_informative");
            else if ($opDiv.hasClass("fpmod_political")) $cardDiv.addClass("cs_thread_pane_card_political");
            else $cardDiv.addClass("cs_thread_pane_card_ontopic");

            const $rootPostBodyDiv = $('<div class="cs_thread_pane_root_body">').html(rootBodyHtml);

            $cardDiv.append($rootPostBodyDiv);
            $listDiv.append($cardDiv);

            mostRecentSubtree.reverse();

            const $repliesDiv = $('<div class="cs_thread_pane_replies">');
            $cardDiv.append($repliesDiv);
            let parentDiv = $repliesDiv;
            for (let i = 0; i < mostRecentSubtree.length; i++) {
                const {
                    postAuthor,
                    postPreviewHtml,
                }: { postAuthor: string; postPreviewHtml: string } = mostRecentSubtree[i];
                const $postDiv = $('<div class="cs_thread_pane_reply">');
                $postDiv.append($('<div class="cs_thread_pane_reply_arrow">').text("↪"));
                $postDiv.append($('<div class="cs_thread_pane_reply_preview">').html(postPreviewHtml));
                $postDiv.append($('<div class="cs_thread_pane_reply_divider">').text(":"));
                $postDiv.append($('<div class="cs_thread_pane_reply_author">').text(postAuthor));
                const isMostRecentReply = i === mostRecentSubtree.length - 1;
                if (isMostRecentReply) $postDiv.addClass("cs_thread_pane_most_recent_reply");

                parentDiv.append($postDiv);
                parentDiv = $postDiv;
            }

            if (!parentIsRoot) $repliesDiv.addClass("cs_thread_pane_replies_not_at_root");

            let mostRecentPostId = threadId;
            for (const { postId } of mostRecentSubtree) if (postId > mostRecentPostId) mostRecentPostId = postId;

            $cardDiv.click(() => {
                const $li = $(`li#item_${mostRecentPostId}`);
                const li_root = $li.closest("[id^='root_']");
                ThreadPane.uncapThread(threadId);

                $opDiv.removeClass("cs_flash_animation");
                $li.removeClass("cs_flash_animation");
                $cardDiv.removeClass("cs_dim_animation");

                setTimeout(() => {
                    const elemFits = li_root.length > 0 && elementFitsViewport(li_root[0]);
                    // scroll to fit thread or newest reply if applicable
                    if (elemFits) scrollToElement(li_root[0], true);
                    else if ($li.length > 0) scrollToElement($li[0]);

                    $opDiv.addClass("cs_flash_animation");
                    $li.addClass("cs_flash_animation");
                    $cardDiv.addClass("cs_dim_animation");
                }, 0);
            });
        }

        // restore the previous scroll position
        $threadPaneDiv.scrollTop(previousThreadPaneScrollTop);
    },

    getHtmlWithTrimmedLineBreaks(container: JQuery<HTMLElement>) {
        return container
            .html()
            .replace(/[\r\n]/gm, "") // strip newlines, we only need the <br>s
            .replace(/\<br\>/gm, " "); // strip <br>s
    },

    cloneRootPostBody(opDiv: JQuery<HTMLElement>, threadId: number) {
        const $rootPostbodyDiv = opDiv.find("div.postbody").first();
        if ($rootPostbodyDiv.length !== 1) throw new Error(`Couldn't find the div.postbody for thread ${threadId}.`);
        const $cloned = $rootPostbodyDiv.clone();
        $cloned.find("a").replaceWith(function () {
            return $(`<span class="cs_thread_pane_link">${(this as HTMLAnchorElement).href}</span>`);
        });
        // remove embed containers from Thread Pane parent
        $cloned.find("#react-media-manager, div.medialink").remove();
        return $cloned;
    },

    parseRootAuthor($opDiv: JQuery<HTMLElement>) {
        // https://stackoverflow.com/a/14755309
        // make sure we only grab the text in the root element, because the user popup menu may be nested
        // there as well
        const $rootAuthor = $opDiv.find(`
            div.postmeta span.author span.user a,
            div.postmeta span.author span.user
        `);
        // avoid exploding on an empty root post
        if ($rootAuthor.length !== 0) {
            return $rootAuthor
                .contents()
                .filter(function () {
                    return this.nodeType === 3;
                })[0]
                .nodeValue.split(" - ")[0];
        } else "";
    },

    parseThreadId(threadDiv: JQuery<HTMLElement>) {
        if (!threadDiv?.attr("id").startsWith("root_")) {
            throw new Error(`Did not expect the root div to have an element id of "${threadDiv.attr("id")}".`);
        }

        const threadId = parseInt(threadDiv.attr("id").substring("root_".length));
        if (threadId < 1 || threadId > 50000000) throw new Error(`The thread ID of ${threadId} seems bogus.`);
        return threadId;
    },

    parseThreadPostCount(threadDiv: JQuery<HTMLElement>) {
        const $capcontainerDiv = threadDiv.find("div.capcontainer");
        if ($capcontainerDiv.length !== 1) {
            // no replies
            return 1;
        }
        const $onelineDivs = $capcontainerDiv.find("div.oneline");
        return $onelineDivs.length + 1;
    },

    parseMostRecentPosts(threadDiv: JQuery<HTMLElement>, threadId: number) {
        const mostRecentSubtree = [] as RecentPostSubtree[];
        let $mostRecentPost: JQuery<HTMLElement>;
        for (let i = 0; i < 10 && $mostRecentPost?.length !== 1; i++) {
            $mostRecentPost = threadDiv.find(`div.oneline${i}`) as JQuery<HTMLElement>;
        }

        // don't fail, it will cause the entire pane to disappear. better for it to look weird
        if ($mostRecentPost?.length !== 1) return { parentIsRoot: true, mostRecentSubtree: [] };

        while (!$mostRecentPost.hasClass("threads")) {
            if ($mostRecentPost[0].nodeName.toUpperCase() === "LI" && $mostRecentPost[0].id.startsWith("item_")) {
                const postId = parseInt($mostRecentPost[0].id.substring("item_".length));
                if (postId === threadId) break;

                const $oneline = $($mostRecentPost.find("div.oneline")[0]) as JQuery<HTMLElement>;
                const postAuthor = $($oneline.find("span.oneline_user")[0]).text();
                const postPreviewHtml = $($oneline.find("span.oneline_body")[0]).html();
                mostRecentSubtree.push({ postAuthor, postPreviewHtml, postId });
            }
            $mostRecentPost = $mostRecentPost.parent();
        }

        // trim to at most 4 replies
        const maxReplies = 4;
        const parentIsRoot = mostRecentSubtree.length <= maxReplies;
        return {
            parentIsRoot,
            mostRecentSubtree: mostRecentSubtree.slice(0, maxReplies),
        } as RecentPosts;
    },

    uncapThread(threadId: number) {
        const $a = $(`#root_${threadId}`);
        if ($a.hasClass("capped")) $a.removeClass("capped");
    },
};

export default ThreadPane;
