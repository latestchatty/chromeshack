// Inspired by dodob's old postget script.
let GetPost = {
    getLinks(item) {
        let links = [...item.querySelectorAll(".sel .postbody a")];
        if (links) processExpandoLinks(links, GetPost.isChattyLink, GetPost.getPost);
    },

    isChattyLink(href) {
        let _isRootPost = /shacknews.com\/chatty\?id=\d+/i;
        if (_isRootPost.test(href)) return true;
        return false;
    },

    getPost(e, parsedPost, postId, index) {
        if (e.button == 0) {
            e.preventDefault();
            let _expandoClicked = e.target.classList !== undefined && objContains("expando", e.target.classList);
            let link = _expandoClicked ? e.target.parentNode : e.target;
            if (toggleMediaItem(link, postId, index)) return;
            let chattyPostId = link.href.match(/[?&]id=([^&#]*)/);
            let singlePost = chattyPostId && `https://www.shacknews.com/frame_chatty.x?root=&id=${chattyPostId[1]}`;
            if (singlePost) {
                fetchSafe({ url: singlePost }).then(data => {
                    let postDiv = document.createElement("div");
                    // hack-ish way of "parsing" string to DOM (sanitized!)
                    postDiv.appendChild(data);
                    postDiv = postDiv.childNodes[1];
                    // honor spoiler tags' click event when embedded
                    spoilerTag = postDiv && postDiv.querySelector("span.jt_spoiler");
                    if (spoilerTag) {
                        spoilerTag.addEventListener("click", e => {
                            e.target.setAttribute("class", "jt_spoiler_clicked");
                        });
                    }
                    // nuke fullpost class as we don't want
                    // chatview.js to interact with posts it's
                    // not meant to handle
                    postDiv.setAttribute("class", "getPost");
                    postDiv.setAttribute("id", `getpost_${postId}-${index}`);
                    toggleMediaItem(link);
                    link.parentNode.insertBefore(postDiv, link.nextSibling);
                    // workaround to enable media embeds in embedded chatty posts
                    const item = document.querySelector(`li#item_${postId}`);
                    const root = item && item.closest(".root");
                    const root_id = root && root.id.substr(5);
                    if (item && root_id) ChromeShack.processPost(item, root_id);
                });
            }
        }
    }
};

addDeferredHandler(enabledContains("getpost"), res => {
    if (res) processPostEvent.addHandler(GetPost.getLinks);
});
