// Inspired by dodob's old postget script.
let GetPost = {
    getLinks(item) {
        let links = item.querySelectorAll(".sel .postbody > a");
        for (let i = 0; i < links.length; i++) {
            if (GetPost.isChattyLink(links[i].href)) {
                (i => {
                    if (links[i].querySelector("div.expando")) return;
                    links[i].addEventListener("click", e => {
                        GetPost.getPost(e, i);
                    });

                    let _postBody = links[i].parentNode;
                    let _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    insertExpandoButton(links[i], _postId, i);
                })(i);
            }
        }
    },

    isChattyLink(href) {
        let _isRootPost = /shacknews.com\/chatty\?id=\d+/i;
        if (_isRootPost.test(href)) {
            return true;
        }
        return false;
    },

    getPost(e, index) {
        if (e.button == 0) {
            e.preventDefault();
            let _expandoClicked =
                e.target.classList !== undefined && objContains("expando", e.target.classList);
            let link = _expandoClicked ? e.target.parentNode : e.target;
            let _postBody = link.parentNode;
            let _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
            if (toggleMediaItem(link, _postId, index)) return;

            let chattyPostId = link.href.match(/[?&]id=([^&#]*)/);
            let singlePost = `https://www.shacknews.com/frame_chatty.x?root=&id=${chattyPostId[1]}`;

            fetchSafe(singlePost).then(data => {
                let postDiv = document.createElement("div");
                // hack-ish way of "parsing" string to DOM (sanitized!)
                postDiv.appendChild(data);
                postDiv = postDiv.childNodes[1];

                // nuke fullpost class as we don't want
                // chatview.js to interact with posts it's
                // not meant to handle
                postDiv.setAttribute("class", "getPost");
                postDiv.setAttribute("id", `getpost_${_postId}-${index}`);
                toggleMediaItem(link);
                link.parentNode.insertBefore(postDiv, link.nextSibling);
            });
        }
    }
};

addDeferredHandler(enabledContains("getpost"), res => {
    if (res) processPostEvent.addHandler(GetPost.getLinks);
});
