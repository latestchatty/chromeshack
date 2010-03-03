ChromeShack =
{
    install: function()
    {
        // start listening for new nodes (replies) being inserted
        document.addEventListener('DOMNodeInserted', function(e)
        {

            var source_id = e.srcElement.id;

            // starts with "root", they probably refreshed the thread
            if (source_id && source_id.indexOf("root_") == 0)
            {
                ChromeShack.processFullPosts(e.srcElement); 
            }
            else if (source_id == "postbox")
            {
                ChromeShack.processPostBox(e.srcElement);
            }

            // starts with "item_", they probably clicked on a reply
            if (e.relatedNode.id.indexOf("item_") == 0)
            {
                // grab the id from the old node, since the new node doesn't contain the id
                var id = e.relatedNode.id.substr(5);
                ChromeShack.processPost(e.srcElement, id);
            }
        }, true);
    },

    processFullPosts: function(element)
    {
        // process fullposts
        var items = document.evaluate("//div[contains(@class, 'fullpost')]/..", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        for (item = null, i = 0; item = items.snapshotItem(i); i++)
        {
            ChromeShack.processPost(item, item.id.substr(5));
        }
    },

    processPost: function(item, root_id)
    {
        parsePostEvent.raise(item, root_id);
    },

    processPostBox: function(postbox)
    {
        postBoxEvent.raise(postbox);
    }

}

ChromeShack.install();
ChromeShack.processFullPosts(document);
