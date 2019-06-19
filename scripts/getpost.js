// Inspired by dodob's old postget script.
settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("getpost")) {
        GetPost = {
            getLinks: function(item) {
                var links = item.querySelectorAll(".sel .postbody > a");
                for (var i = 0; i < links.length; i++) {
                    if (GetPost.isChattyLink(links[i].href)) {
                        (i => {
                            if (links[i].querySelector("div.expando")) return;
                            links[i].addEventListener("click", e => {
                                GetPost.getPost(e, i);
                            });

                            var _postBody = links[i].parentNode;
                            var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                            insertExpandoButton(links[i], _postId, i);
                        })(i);
                    }
                }
            },

            isChattyLink: function(href) {
                var _isRootPost = /shacknews.com\/chatty\?id=\d+/i;
                if (_isRootPost.test(href)) { return true; }
                return false;
            },

            getPost: function(e, index) {
                if (e.button == 0) {
                    e.preventDefault();
                    var _expandoClicked = e.target.classList !== undefined && e.target.classList.contains("expando");
                    var link = _expandoClicked ? e.target.parentNode : e.target;
                    var _postBody = link.parentNode;
                    var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    if (toggleMediaItem(link, _postId, index)) return;

                    var chattyPostId = link.href.match(/[?&]id=([^&#]*)/);
                    var singlePost = `https://www.shacknews.com/frame_chatty.x?root=&id=${chattyPostId[1]}`;

                    xhrRequest(singlePost).then(async res => {
                        var response = await res.text();
                        var postDiv = document.createElement("div");
                        // hack-ish way of "parsing" string to DOM
                        postDiv.innerHTML = purify(response);
                        postDiv = postDiv.childNodes[3];

                        // nuke fullpost class as we don't want
                        // chatview.js to interact with posts it's
                        // not meant to handle
                        postDiv.setAttribute("class", "getPost");
                        postDiv.setAttribute("id", `getpost_${_postId}-${index}`);
                        toggleMediaLink(null, link, true);
                        link.parentNode.insertBefore(postDiv, link.nextSibling);
                    }).catch(err => { console.log(err); });
                }
            }
        }
        processPostEvent.addHandler(GetPost.getLinks);
    }
});
