// Inspired by dodob's old postget script.
settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("getpost")) {
        GetPost = {
            getLinks: function(item, id) {
                var links = document.querySelectorAll("div.postbody a");
                if (links.length > 0) {
                    for (var i = 0; i < links.length; i++) {
                        if (GetPost.isChattyLink(links[i].href))
                            links[i].addEventListener("click", GetPost.getPost);
                    }
                }
            },

            isChattyLink: function(href) {
                var _isRootPost = /shacknews.com\/chatty\?id=\d+$/i;
                if (_isRootPost.test(href)) { return true; }
                return false;
            },

            getPost: function(e) {
                if (e.button == 0) {
                    var link = this;

                    if (link.nextSibling != null && link.nextSibling.className == "getPost")
                        link.parentNode.removeChild(link.nextSibling);
                    else {
                        var postId = link.href.match(/[?&]id=([^&#]*)/);
                        var singlePost = `https://www.shacknews.com/frame_chatty.x?root=&id=${postId[1]}`;

                        var request = new XMLHttpRequest();
                        request.onreadystatechange = function() {
                            if (request.readyState == 4 && request.status == 200) {
                                var postDiv = document.createElement("div");
                                // hack-ish way of "parsing" string to DOM
                                postDiv.replaceHTML(request.responseText);
                                console.log(postDiv);
                                postDiv = postDiv.childNodes[1];

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
