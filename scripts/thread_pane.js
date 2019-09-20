let refreshThreadPane;
let ThreadPane = {
    install() {
        // regenerate the thread pane when the user refreshes a thread.
        processPostRefreshEvent.addHandler(() => refreshThreadPane);

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

            const threadId = ThreadPane.parseThreadId(threadDiv);

            const $opDiv = $($threadDiv.find("ul li div.fullpost")[0]);

            const rootAuthor = ThreadPane.parseRootAuthor($opDiv);
            const $rootBodyDiv = ThreadPane.cloneRootPostBody($opDiv, threadId);
            const rootBodyHtml = ThreadPane.getHtmlWithTrimmedLineBreaks($rootBodyDiv);
            const postCount = ThreadPane.parseThreadPostCount($threadDiv, threadId);
            const { parentIsRoot, mostRecentSubtree } = ThreadPane.parseMostRecentPosts($threadDiv, threadId);
            const isRefreshPending = $opDiv.find(".refresh_pending").length > 0;

            // begin constructing the thread summary card in the thread pane
            const $cardDiv = $('<div class="cs_thread_pane_card">');
            $cardDiv.append(
                $('<div class="cs_thread_pane_post_count">').text(`${postCount} post${postCount === 1 ? "" : "s"}`)
            );
            $cardDiv.append($('<div class="cs_thread_pane_root_author">').text(rootAuthor));

            if (isRefreshPending) $cardDiv.addClass("cs_thread_pane_card_refresh_pending");
            else if ($opDiv.hasClass("fpmod_nws")) $cardDiv.addClass("cs_thread_pane_card_nws");
            else if ($opDiv.hasClass("fpmod_informative")) $cardDiv.addClass("cs_thread_pane_card_informative");
            else if ($opDiv.hasClass("fpmod_political")) $cardDiv.addClass("cs_thread_pane_card_political");
            else $cardDiv.addClass("cs_thread_pane_card_ontopic");

            const $rootPostBodyDiv = $('<div class="cs_thread_pane_root_body">').html(rootBodyHtml);
            $rootPostBodyDiv.find("a").replaceWith(function() {
                // exclude expando children
                return $(`<span class="cs_thread_pane_link">${this.href}</span>`);
            });
            // remove media containers from Thread Pane parent
            $rootPostBodyDiv.find(".media-container").remove();
            // remove embedded chatty post containers from Thread Pane parent
            $rootPostBodyDiv.find(".getPost").remove();
            $cardDiv.append($rootPostBodyDiv);
            $listDiv.append($cardDiv);

            mostRecentSubtree.reverse();

            const $repliesDiv = $('<div class="cs_thread_pane_replies">');
            $cardDiv.append($repliesDiv);
            let parentDiv = $repliesDiv;
            for (let i = 0; i < mostRecentSubtree.length; i++) {
                const { postAuthor, postPreviewHtml } = mostRecentSubtree[i];
                const $postDiv = $('<div class="cs_thread_pane_reply">');
                $postDiv.append($('<div class="cs_thread_pane_reply_arrow">').text("↪"));
                $postDiv.append($('<div class="cs_thread_pane_reply_preview">').html(postPreviewHtml));
                $postDiv.append($('<div class="cs_thread_pane_reply_divider">').text(":"));
                $postDiv.append($('<div class="cs_thread_pane_reply_author">').text(postAuthor));
                const isMostRecentReply = i === mostRecentSubtree.length - 1;
                if (isMostRecentReply) {
                    $postDiv.addClass("cs_thread_pane_most_recent_reply");
                }

                parentDiv.append($postDiv);
                parentDiv = $postDiv;
            }

            if (!parentIsRoot) {
                $repliesDiv.addClass("cs_thread_pane_replies_not_at_root");
            }

            let mostRecentPostId = threadId;
            for (const { postId } of mostRecentSubtree) {
                if (postId > mostRecentPostId) {
                    mostRecentPostId = postId;
                }
            }

            $cardDiv.click(() => {
                const $li = $(`li#item_${mostRecentPostId}`);
                const li_root = $li.closest("[id^='root_']");
                ThreadPane.uncapThread(threadId);

                $opDiv.removeClass("cs_flash_animation");
                $li.removeClass("cs_flash_animation");
                $cardDiv.removeClass("cs_dim_animation");

                setTimeout(() => {
                    let elemFits = elementFitsViewport(li_root);
                    // scroll to fit thread or newest reply if applicable
                    if (elemFits) scrollToElement(li_root, true);
                    else scrollToElement($li);

                    $opDiv.addClass("cs_flash_animation");
                    $li.addClass("cs_flash_animation");
                    $cardDiv.addClass("cs_dim_animation");
                }, 0);
            });
        }

        // restore the previous scroll position
        $threadPaneDiv.scrollTop(previousThreadPaneScrollTop);
    },

    getHtmlWithTrimmedLineBreaks(container) {
        return container
            .html()
            .replace(/[\r\n]/g, "") // strip newlines, we only need the <br>s
            .replace(/^(<br>)+/, ""); // strip leading <br>s
    },

    cloneRootPostBody(opDiv, threadId) {
        const $rootPostbodyDiv = opDiv.find("div.postbody").first();
        if ($rootPostbodyDiv.length !== 1) {
            throw new Error(`Couldn't find the div.postbody for thread ${threadId}.`);
        }
        return $rootPostbodyDiv.clone();
    },

    parseRootAuthor($opDiv) {
        // https://stackoverflow.com/a/14755309
        // make sure we only grab the text in the root element, because the user popup menu may be nested
        // there as well
        const $rootAuthor = $opDiv.find(`
            div.postmeta span.author span.user a,
            div.postmeta span.author span.user
        `);
        return $rootAuthor.contents().filter(function() {
            return this.nodeType === 3;
        })[0].nodeValue;
    },

    parseThreadId(threadDiv) {
        if (!threadDiv.id.startsWith("root_")) {
            throw new Error(`Did not expect the root div to have an element id of "${threadDiv.id}".`);
        }
        const threadId = parseInt(threadDiv.id.substring("root_".length));
        if (threadId < 1 || threadId > 50000000) {
            throw new Error(`The thread ID of ${threadId} seems bogus.`);
        }
        return threadId;
    },

    parseThreadPostCount(threadDiv) {
        const $capcontainerDiv = threadDiv.find("div.capcontainer");
        if ($capcontainerDiv.length !== 1) {
            // no replies
            return 1;
        }
        const $onelineDivs = $capcontainerDiv.find("div.oneline");
        return $onelineDivs.length + 1;
    },

    parseMostRecentPosts(threadDiv, threadId) {
        const mostRecentSubtree = [];
        let $mostRecentPost = [];
        let onelineNumber = 0;
        while ($mostRecentPost.length !== 1 && onelineNumber < 10) {
            $mostRecentPost = threadDiv.find("div.oneline" + onelineNumber++);
        }

        if ($mostRecentPost.length !== 1) {
            // don't fail, it will cause the entire pane to disappear. better for it to look weird
            return { parentIsRoot: true, mostRecentSubtree: [] };
        }

        let $post = $mostRecentPost;
        while (!$post.hasClass("threads")) {
            if ($post[0].nodeName.toUpperCase() === "LI" && $post[0].id.startsWith("item_")) {
                const postId = parseInt($post[0].id.substring("item_".length));
                if (postId === threadId) break;

                $oneline = $($post.find("div.oneline")[0]);
                const postAuthor = $($oneline.find("span.oneline_user")[0]).text();
                const postPreviewHtml = $($oneline.find("span.oneline_body")[0]).html();
                mostRecentSubtree.push({ postAuthor, postPreviewHtml, postId });
            }
            $post = $post.parent();
        }

        // trim to at most 4 replies
        const maxReplies = 4;
        const parentIsRoot = mostRecentSubtree.length <= maxReplies;
        return { parentIsRoot, mostRecentSubtree: mostRecentSubtree.slice(0, maxReplies) };
    },

    uncapThread(threadId) {
        const $a = $(`#root_${threadId}`);
        if ($a.hasClass("capped")) {
            $a.removeClass("capped");
        }
    }
};

addDeferredHandler(enabledContains("thread_pane"), res => {
    if (res) {
        refreshThreadPane = () => {
            try {
                ThreadPane.install();
            } catch (e) {
                console.log("Failed to install the thread_pane script:");
                console.log(e);
                $("div#cs_thread_pane").remove();
                $("body").removeClass("cs_thread_pane_enable");
            }
        };
        refreshThreadPane();
    }
});
