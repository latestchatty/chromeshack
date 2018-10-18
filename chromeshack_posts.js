ChromeShack =
{
    install: function()
    {
        // use MutationObserver instead of Mutation Events for a massive performance boost
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type == "childList") {
                    mutation.addedNodes.forEach(function (node) {
                        var elem = node.parentNode;
                        var source_id = elem.id;

                        // starts with "root", they probably refreshed the thread
                        if (node && node.id.indexOf("root_") == 0)
                        {
                            ChromeShack.processFullPosts(elem);
                        }
                        else if (source_id == "postbox")
                        {
                            console.log(elem);
                            ChromeShack.processPostBox(elem);
                        }

                        // starts with "item_", they probably clicked on a reply
                        if (source_id.indexOf("item_") == 0)
                        {
                            // grab the id from the old node, since the new node doesn't contain the id
                            var id = source_id.substr(5);
                            ChromeShack.processPost(elem, id);
                        }
                    })
                }
            })
        });
        observer.observe(document, { characterData: true, subtree: true, childList: true });

        // DEPRECATED: start listening for new nodes (replies) being inserted
        // document.addEventListener('DOMNodeInserted', function(e) {
        //     var source_id = e.srcElement.id;

        //     // starts with "root", they probably refreshed the thread
        //     if (source_id && source_id.indexOf("root_") == 0)
        //     {
        //         console.log(e.srcElement);
        //         ChromeShack.processFullPosts(e.srcElement);
        //     }
        //     else if (source_id == "postbox")
        //     {
        //         console.log(e.srcElement);
        //         ChromeShack.processPostBox(e.srcElement);
        //     }

        //     // starts with "item_", they probably clicked on a reply
        //     console.log(e.relatedNode);
        //     if (e.relatedNode.id.indexOf("item_") == 0)
        //     {
        //         // grab the id from the old node, since the new node doesn't contain the id
        //         var id = e.relatedNode.id.substr(5);
        //         console.log(e.relatedNode.id, id);
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
