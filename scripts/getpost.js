// Inspired by dodob's old postget script.
// Don't look at the code too closely, as it will make you weep.
settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("getpost"))
    {
        GetPost =
        {   
            getLinks: function(item, id)
            {
                var postBody = getDescendentByTagAndClassName(item, "div", "postbody");
                var links = postBody.getElementsByTagName("a");
              
                for (var i = 0; i < links.length; i++)
                {
                    if (GetPost.isChattyLink(links[i].href))
                    {
                        links[i].addEventListener("click", GetPost.getPost);
                    }
                }
            },
            
            isChattyLink: function(href)
            {
                if (/shacknews.com\/chatty\?id=\d+/.test(href)
                ||  /shacknews.com\/article\/\d+\/[a-zA-z0-9-]*\?id=\d+/.test(href))
                {
                    return true;
                }
            },
            
            getPost: function(e)
            {
                if (e.button == 0)
                {
                    var link = this;
                    
                    if (link.nextSibling != null && link.nextSibling.className == "getPost")
                    {
                        link.parentNode.removeChild(link.nextSibling);
                    }
                    else
                    {
                        var postId = link.href.match(/[?&]id=([^&#]*)/);
                        
                        var singlePost = 'http';
                        if (window.location.protocol == "https:") {
                            singlePost += 's';
                        }
                        singlePost += "://www.shacknews.com/frame_chatty.x?root=&id=" + postId[1];
                        
                        var request = new XMLHttpRequest();
                        request.onreadystatechange = function()
                        {
                            if (request.readyState == 4 && request.status == 200)
                            {
                                var postDiv = document.createElement("div");
                                // hack-ish way of "parsing" string to DOM
                                postDiv.innerHTML = request.responseText;
                                postDiv = postDiv.childNodes[5];

                                // nuke fullpost class as we don't want
                                // chatview.js to interact with posts it's 
                                // not meant to handle
                                postDiv.setAttribute("class", "getPost");

                                link.parentNode.insertBefore(postDiv, link.nextSibling);
                                
                                // yo dawg...
                                GetPost.getLinks(link.nextSibling, null);
                            }
                        }
                        request.open("GET", singlePost, true);
                        request.send();
                    }
                    e.preventDefault();
                }
            }
        }
        processPostEvent.addHandler(GetPost.getLinks);
    }
});
