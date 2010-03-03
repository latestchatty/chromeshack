// start listening for new nodes (replies) being inserted
document.addEventListener('DOMNodeInserted', function(e)
{

    // starts with "root", they probably refreshed the thread
    if (e.srcElement.id.indexOf("root_") == 0)
    {
        processFullPosts(e.srcElement); 
    }

    // starts with "item_", they probably clicked on a reply
    if (e.relatedNode.id.indexOf("item_") == 0)
    {
        // grab the id from the old node, since the new node doesn't contain the id
        var id = e.relatedNode.id.substr(5);
        processPost(e.srcElement, id);
    }
}, true);

// process posts on the main page
processFullPosts(document);

function processFullPosts(element)
{
    // process fullposts
    var items = document.evaluate("//div[contains(@class, 'fullpost')]/..", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (item = null, i = 0; item = items.snapshotItem(i); i++)
    {
        processPost(item, item.id.substr(5));
    }
}

function processPost(item, root_id)
{
    LOL.installButtons(item, root_id);
    // do other things here if needed, like insert sparkly and dinogegtik
}

function getDescendentByTagAndClassName(parent, tag, class) 
 {
    var descendents = parent.getElementsByTagName(tag);
    for (var i = 0; i < descendents.length; i++) 
    {
        if (descendents[i].className.indexOf(class) == 0) 
            return descendents[i];
    }
}
