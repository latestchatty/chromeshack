ChromeShack =
{
    install: function()
    {
        // use MutationObserver instead of Mutation Events
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var nodes = Array.prototype.slice.call(mutation.addedNodes);
                nodes.forEach(function(node) {
                    if (node.parentElement.id && node.parentElement.id.indexOf("root_") == 0) {
                        // starts with "root", they probably refreshed the thread
                        ChromeShack.processFullPosts(node.parentElement);
                    }
                    else if (node.parentElement.id == "postbox") {
                        // starts with "root", they probably refreshed the thread
                        ChromeShack.processPostBox(node.parentElement);
                    }

                    // starts with "item_", they probably clicked on a reply
                    if (node.nextSibling.id.indexOf("item_") == 0)
                    {
                        // grab the id from the old node, since the new node doesn't contain the id
                        var id = node.nextSibling.id.substr(5);
                        ChromeShack.processPost(node.nextSibling, id);
                    }
                });
            });
        });
        observer.observe(document, {childList: true});

        // DEPRECATED: start listening for new nodes (replies) being inserted
        // document.addEventListener('DOMNodeInserted', function(e) {
        //     var source_id = insertedNodes.id;

        //     // starts with "root", they probably refreshed the thread
        //     if (source_id && source_id.indexOf("root_") == 0)
        //     {
        //         ChromeShack.processFullPosts(e.srcElement);
        //     }
        //     else if (source_id == "postbox")
        //     {
        //         ChromeShack.processPostBox(e.srcElement);
        //     }

        //     // starts with "item_", they probably clicked on a reply
        //     if (e.relatedNode.id.indexOf("item_") == 0)
        //     {
        //         // grab the id from the old node, since the new node doesn't contain the id
        //         var id = e.relatedNode.id.substr(5);
        //         ChromeShack.processPost(e.relatedNode, id);
        //     }
        // });
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
