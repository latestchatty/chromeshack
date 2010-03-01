if (String(location.href).indexOf('frame_laryn.x') >= 0)
{
    var qs = new Querystring();
    if (qs.contains("id"))
    {
        console.log(location.href);
        // process inidivitual post
        console.log('loading iframe - single post.')
    }
    else
    {
        console.log(location.href);
        // process individual posts
        console.log('loading iframe - thread.')
    }
}
else if (String(location.href).indexOf('laryn.x') >= 0)
{
    console.log(location.href);
    console.log('loading chatty.')

    var items = document.evaluate("//div[contains(@class, 'fullpost')]/..", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    for (item = null, i = 0; item = items.snapshotItem(i); i++)
    {
        processPost(item, item.id.substr(5));
    }
}

function processPost(item, root_id)
{
    installLolButtons(item, root_id);

    
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
        console.log("getDescendentByTagAndClassName could not locate span.author");
        return;
    }

    var lol_div = document.createElement("div");
    lol_div.id = lol_div_id;
    lol_div.setAttribute('style', 'display: inline; float: none; padding-left: 10px; font-size: 14px;');
    
    var buttonHtml = ''; 
    buttonHtml += ' [<a id="lol' + id + '" style="cursor: pointer; color: #f80; padding: 0 0.25em; text-decoration: underline;">lol</a>]'; 
    buttonHtml += ' [<a id="inf' + id + '" style="cursor: pointer; color: #09c; padding: 0 0.25em; text-decoration: underline;">inf</a>]';
    buttonHtml += ' [<a id="unf' + id + '" style="cursor: pointer; color: #f00; padding: 0 0.25em; text-decoration: underline;">unf</a>]';
    buttonHtml += ' [<a id="tag' + id + '" style="cursor: pointer; color: #7b2; padding: 0 0.25em; text-decoration: underline;">tag</a>]';
    buttonHtml += ' [<a id="wtf' + id + '" style="cursor: pointer; color: #C000C0; padding: 0 0.25em; text-decoration: underline;">wtf</a>]';
    buttonHtml += ' [<a id="tth' + id + '" style="cursor: pointer; color: #fbb; padding: 0 0.25em; text-decoration: underline;">tth</a>]';
    
    lol_div.innerHTML = buttonHtml; 

    author.appendChild(lol_div);
}

function lolThread(event)
{
    var tag = event.target.getAttribute('id').substr(0, 3);
    var id = event.target.getAttribute('id').substr(3);
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

console.log("finished loading.");

