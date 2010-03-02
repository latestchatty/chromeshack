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
installCommentTags();

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

function installCommentTags()
{
    var postform = document.getElementById("postform");
    if (postform)
    {
        var comment_tags = document.createElement("div");
        comment_tags.setAttribute("shack_comment_tags");
        comment_tags.innerHTML = '<p>Comment Tags;</p>' +
                '<table cellpadding="2" border="0" cellspacing="0">' +
                '<tr><td><span class="jt_red">red</span></td><td>r{ ... }r</td>' +
                '<td><i>italics</i></td><td>/[ ... ]/</td></tr>' +
                '<tr><td><span class="jt_green">green</span></td><td>g{ ... }g</td>' +
                '<td><b>bold</b></td><td>b[ ... ]b</td></tr>' +
                '<tr><td><span class="jt_blue">blue</span></td><td>b{ ... }b</td>' +
                '<td><span class="jt_quote">quote</span></td><td>q[ ... ]q</td></tr>' +
                '<tr><td><span class="jt_yellow">yellow</span></td><td>y{ ... }y</td>' +
                '<td><span class="jt_sample">sample</span></td><td>s[ ... ]s</td></tr>' +
                '<tr><td><span class="jt_olive">olive</span></td><td>e[ ... ]e</td>' +
                '<td><u>underline</u></td><td>_[ ... ]_</td></tr>' +
                '<tr><td><span class="jt_lime">limegreen</span></td><td>l[ ... ]l</td>' +
                '<td><span class="jt_strike">strike</span></td><td>-[ ... ]-</td></tr>' +
                '<tr><td><span class="jt_orange">orange</span></td><td>n[ ... ]n</td>' +
                '<td><span class="jt_spoiler" onclick="return doSpoiler( event );">spoiler</span></td><td>o[ ... ]o</td></tr>' +
                '<tr><td><span class="jt_pink">multisync</span></td><td>p[ ... ]p</td>' +
                '<td><pre class="jt_code">code</pre></td><td>/{{ ... }}/</td></tr>' +
                '</table>';

        postform.parentNode.insertBefore(comment_tags, postform.nextSibling);
    }


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
