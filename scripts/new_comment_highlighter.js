// some parts taken from Greg Laabs "OverloadUT"'s New Comments Marker greasemonkey script
settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("new_comment_highlighter"))
    {
        NewCommentHighlighter =
        {
            highlight: function()
            {
                var last_id = getSetting("new_comment_highlighter_last_id");
                var new_last_id = NewCommentHighlighter.findLastID();

                // only highlight if we wouldn't highlight everything on the page
                if (last_id != null && (new_last_id - last_id) < 1000)
                {
                    NewCommentHighlighter.highlightPostsAfter(last_id);
                }

                if (last_id == null || new_last_id > last_id)
                {
                    setSetting('new_comment_highlighter_last_id', new_last_id);
                }
            },

            highlightPostsAfter: function(last_id)
            {
                var new_posts = NewCommentHighlighter.getPostsAfter(last_id);

                var post;
                for (i = 0; i < new_posts.snapshotLength; i++)
                {
                    var post = new_posts.snapshotItem(i);

                    var preview = post.getElementsByClassName('oneline_body');
                    if(preview.length > 0) {
                        preview[0].className += " newcommenthighlighter";
                    }
                }

                NewCommentHighlighter.displayNewCommentCount(new_posts.snapshotLength);
            },

            displayNewCommentCount: function(count)
            {
                // https://stackoverflow.com/a/11526052
                $('#chatty_settings').children().each(function () {
                    var that = $(this);
                    that.text(that.text().replace(' Comments', ` Comments (${count} New)`));
                });
            },

            getPostsAfter: function(last_id)
            {
                // grab all the posts with post ids after the last post id we've seen
                var query = '//li[number(substring-after(@id, "item_")) > ' + last_id + ']';
                return document.evaluate(query, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            },

            findLastID: function()
            {
                // 'oneline0' is applied to highlight the most recent post in each thread
                // we only want the first one, since the top post will contain the most recent
                // reply.
                var query = '//div[contains(@class, "oneline0")]';
                var post = document.evaluate(query, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                // no posts? no id
                if (post == null)
                    return null;

                var id = post.parentNode.id;
                return parseInt(id.substr(5));
            }
        }

        NewCommentHighlighter.highlight();

    }
});

