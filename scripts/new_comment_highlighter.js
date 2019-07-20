// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script
let NewCommentHighlighter = {
    highlight() {
        getSetting("new_comment_highlighter_last_id").then(last_id => {
            let new_last_id = NewCommentHighlighter.findLastID();

            // only highlight if we wouldn't highlight everything on the page
            if (last_id != null && new_last_id - last_id < 1000) {
                NewCommentHighlighter.highlightPostsAfter(last_id);
            }

            if (last_id == null || new_last_id > last_id) {
                setSetting("new_comment_highlighter_last_id", new_last_id);
            }
        });
    },

    highlightPostsAfter(last_id) {
        let new_posts = NewCommentHighlighter.getPostsAfter(last_id);

        let post;
        for (i = 0; i < new_posts.snapshotLength; i++) {
            let post = new_posts.snapshotItem(i);

            let preview = post.getElementsByClassName("oneline_body");
            if (preview.length > 0) {
                preview[0].className += " newcommenthighlighter";
            }
        }

        NewCommentHighlighter.displayNewCommentCount(new_posts.snapshotLength);
    },

    displayNewCommentCount(count) {
        if (count > 0) {
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
        let query = '//li[number(substring-after(@id, "item_")) > ' + last_id + "]";
        return document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    },

    findLastID() {
        // 'oneline0' is applied to highlight the most recent post in each thread
        // we only want the first one, since the top post will contain the most recent
        // reply.
        let query = '//div[contains(@class, "oneline0")]';
        let post = document.evaluate(query, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
            .singleNodeValue;

        // no posts? no id
        if (post == null) return null;

        let id = post.parentNode.id;
        return parseInt(id.substr(5));
    }
};

addDeferredHandler(settingsContain("new_comment_highlighter"), res => {
    if (res) NewCommentHighlighter.highlight();
});
