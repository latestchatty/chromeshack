import { enabledContains } from "../core/settings";
import { processExpandoLinks, toggleMediaItem } from "../core/media_helpers";
import { objContains, fetchSafe } from "../core/common";
import { processPostEvent } from "../core/events";
import { CS_Instance } from "../content";

// Inspired by dodob's old postget script.
const GetPost = {
    async install() {
        const is_enabled = await enabledContains("getpost");
        if (is_enabled) processPostEvent.addHandler(GetPost.getLinks);
    },

    getLinks(item) {
        const links = [...item.querySelectorAll(".sel .postbody a")];
        if (links) processExpandoLinks(links, GetPost.isChattyLink, GetPost.getPost);
    },

    isChattyLink(href) {
        const _isRootPost = /shacknews.com\/chatty\?id=\d+/i;
        if (_isRootPost.test(href)) return true;
        return false;
    },

    getPost(e, parsedPost, postId, index) {
        if (e.button == 0) {
            e.preventDefault();
            const _expandoClicked = e.target.classList !== undefined && objContains("expando", e.target.classList);
            const link = _expandoClicked ? e.target.parentNode : e.target;
            if (toggleMediaItem(link)) return;
            const chattyPostId = link.href.match(/[?&]id=([^&#]*)/);
            const singlePost = chattyPostId && `https://www.shacknews.com/frame_chatty.x?root=&id=${chattyPostId[1]}`;
            if (singlePost) {
                fetchSafe({ url: singlePost }).then((data: HTMLElement) => {
                    const postDiv = document.createElement("div");
                    // hack-ish way of "parsing" string to DOM (sanitized!)
                    postDiv.appendChild(data);
                    const _postNode = <HTMLElement>postDiv.childNodes[1];
                    // honor spoiler tags' click event when embedded
                    const spoilerTag = _postNode && _postNode.querySelector("span.jt_spoiler");
                    if (spoilerTag) {
                        spoilerTag.addEventListener("click", (e) => {
                            (<HTMLElement>e.target).setAttribute("class", "jt_spoiler_clicked");
                        });
                    }
                    // nuke fullpost class as we don't want
                    // chatview.js to interact with posts it's
                    // not meant to handle
                    postDiv.setAttribute("class", "getPost");
                    postDiv.setAttribute("id", `getpost_${postId}-${index}`);
                    toggleMediaItem(link);
                    const fullpost = postDiv.querySelector("div.fullpost");
                    // strip any mod banners from this embedded post (they look weird)
                    const removedBanner = fullpost.getAttribute("class").replace(/\bfpmod_.*?\s\b/i, "");
                    if (removedBanner) fullpost.setAttribute("class", removedBanner);
                    link.parentNode.insertBefore(postDiv, link.nextSibling);
                    // workaround to enable media embeds in embedded chatty posts
                    const post = document.querySelector(`li#item_${postId}`);
                    const root = post && post.closest(".root > ul > li");
                    if (post) CS_Instance.processPost(post, root.id);
                });
            }
        }
    },
};

export default GetPost;
