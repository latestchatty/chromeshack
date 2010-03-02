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
    installLolButtons(item, root_id);
    // do other things here if needed, like insert sparkly and dinogegtik
}

function installLolButtons(item, id)
{
    var lol_div_id = 'lol_' + id;
    
    // buttons already installed here
    if (document.getElementById(lol_div_id) != null)
        return;

    var author = getDescendentByTagAndClassName(item, "span", "author");
    if (!author)
    {
        console.warning("getDescendentByTagAndClassName could not locate span.author");
        return;
    }

    var lol_div = document.createElement("div");
    lol_div.id = lol_div_id;
    lol_div.className = "lol";
    
    // generate all the buttons
    lol_div.appendChild(createLolButton("lol", id));
    lol_div.appendChild(createLolButton("inf", id));
    lol_div.appendChild(createLolButton("unf", id));
    lol_div.appendChild(createLolButton("tag", id));
    lol_div.appendChild(createLolButton("wtf", id));
    lol_div.appendChild(createLolButton("tth", id));

    // add them in
    author.appendChild(lol_div);
}

function createLolButton(tag, id)
{
    var button = document.createElement("a");
    button.href = "#";
    button.id = tag + id;
    button.className = tag + "_button";
    button.appendChild(document.createTextNode(tag));

    button.addEventListener("click", function()
    {
        lolThread(tag, id);
        return false;
    });

    var span = document.createElement("span");
    span.appendChild(document.createTextNode("["));
    span.appendChild(button);
    span.appendChild(document.createTextNode("]"));

    return span;
}

function lolThread(tag, id)
{
    // this is where the loling happings!
    console.log(tag + "'ing post " + id);
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
