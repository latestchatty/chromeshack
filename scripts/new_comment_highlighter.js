// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script
let NewCommentHighlighter = {
    async highlight() {
        let last_id = await getSetting("new_comment_highlighter_last_id");
        let new_last_id = NewCommentHighlighter.findLastID();
        // only highlight if we wouldn't highlight everything on the page
        if (last_id && new_last_id - last_id < 1000)
            NewCommentHighlighter.highlightPostsAfter(last_id);
        if (!last_id || new_last_id > last_id)
            await setSetting("new_comment_highlighter_last_id", new_last_id);
    },

    highlightPostsAfter(last_id) {
        let new_posts = NewCommentHighlighter.getPostsAfter(last_id);
        for (let post of new_posts || []) {
            let preview = post.querySelector(".oneline_body");
            if (preview && !preview.classList.contains("newcommenthighlighter"))
                preview.classList.add("newcommenthighlighter");
        }
        NewCommentHighlighter.displayNewCommentCount(new_posts.length);
    },

    displayNewCommentCount(count) {
        if (count && count > 0) {
            let commentDisplay = document.getElementById("chatty_settings");
            let commentsCount =
                commentDisplay.childNodes[4].innerText != null &&
                commentDisplay.childNodes[4].innerText.split(" ")[0];
            let newComments = `${commentsCount} Comments (${count} New)`;
            if (commentsCount) commentDisplay.childNodes[4].textContent = newComments;
        }
    },

    getPostsAfter(last_id) {
        // grab all the posts with post ids after the last post id we've seen
        return [...document.querySelectorAll("li[id^='item_']")]
            .filter(x => parseInt(x.id.substr(5)) > last_id);
    },

    findLastID() {
        // 'oneline0' is applied to highlight the most recent post in each thread
        // we only want the first one, since the top post will contain the most recent
        // reply.
        let post = document.querySelector("div.oneline0");
        return post ? parseInt(post.parentNode.id.substr(5)) : null;
    }
};

addDeferredHandler(enabledContains("new_comment_highlighter"), res => {
    if (res) {
        NewCommentHighlighter.highlight();
        processRefreshEvent.addHandler(NewCommentHighlighter.highlight);
    }
});
