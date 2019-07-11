ChromeShack =
{
    install: function()
    {
        // use MutationObserver instead of Mutation Events for a massive performance boost
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type == "childList") {
                    mutation.addedNodes.forEach(function (node) {
                        // wrap in a try/catch in case our element node is null
                        try {
                            var elem = node.parentNode;
                            var source_id = (!!elem && elem.id != null) && elem.id;

                            // starts with "root", they probably refreshed the thread
                            if (node.classList != null && objContains("root", node.classList))
                                ChromeShack.processFullPosts(elem);

                            // starts with "item_", they probably clicked on a reply
                            if (!!source_id && source_id.indexOf("item_") == 0)
                            {
                                // grab the id from the old node, since the new node doesn't contain the id
                                var id = source_id.substr(5);
                                ChromeShack.processPost(elem, id);
                            }
                        }
                        catch (e) { console.log("A problem occurred when processing a post:", e); }
                    })

                    mutation.addedNodes.forEach(function (changedNode) {
                        try {
                            var changed_id = changedNode.id !== null && changedNode.id;

                            // check specifically for the postbox being added
                            if (!!changed_id && changed_id == "postbox") {
                                ChromeShack.processPostBox(changedNode);
                            }
                        }
                        catch (e) { console.log("A problem occurred when processing a post:", e); }
                    })
                }
            })
        });
        observer.observe(document, { characterData: true, subtree: true, childList: true });
    },

    processFullPosts: function(element)
    {
        // process fullposts
        var items = document.evaluate(".//div[contains(@class, 'fullpost')]/..", element, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        for (item = null, i = 0; item = items.snapshotItem(i); i++)
        {
            ChromeShack.processPost(item, item.id.substr(5));
        }
        fullPostsCompletedEvent.raise();

        // monkey patch the 'clickItem()' method on Chatty once we're done loading
        browser.runtime.sendMessage({ name: 'chatViewFix' });
        // monkey patch chat_onkeypress to fix busted a/z buttons on nuLOL enabled chatty
        browser.runtime.sendMessage({ name: 'scrollByKeyFix' });
    },

    processPost: function(item, root_id)
    {
        var ul = item.parentNode;
        var div = ul.parentNode;
        var is_root_post = (div.className.indexOf("root") >= 0);
        processPostEvent.raise(item, root_id, is_root_post);
    },

    processPostBox: function(postbox)
    {
        processPostBoxEvent.raise(postbox);
    }
}

settingsLoadedEvent.addHandler(function() {
    ChromeShack.install();
    ChromeShack.processFullPosts(document);
});
