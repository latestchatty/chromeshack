import { arrHas, elemMatches } from "../../core/common";
import type { ParsedPost, ParsedReply, Recents } from "./index.d";

export const flashPost = (rootElem: HTMLDivElement, liElem?: HTMLLIElement) => {
    if (!rootElem) return;
    const _liClasses = liElem?.classList;
    const _fullpostClasses = rootElem?.querySelector("div.fullpost")?.classList;
    _fullpostClasses?.remove("cs_flash_animation");
    _liClasses?.remove("cs_flash_animation");
    setTimeout(() => {
        _fullpostClasses?.add("cs_flash_animation");
        _liClasses?.add("cs_flash_animation");
    }, 0);
};
export const flashCard = (cardElem: HTMLElement) => {
    if (!cardElem) return;
    const _cardClasses = cardElem.classList;
    _cardClasses?.remove("cs_dim_animation");
    setTimeout(() => {
        _cardClasses?.add("cs_dim_animation");
    }, 0);
};

const trimBodyHTML = (elem: HTMLElement) =>
    elem?.innerHTML
        ?.replace(/[\r\n]/gm, "") // strip newlines, we only need the <br>s
        .replace(/\<br\>/gm, " "); // strip <br>s

const getMod = (postElem: HTMLElement) => {
    const classes = postElem?.classList?.toString();
    const matches = classes && /mod_(informative|nws|offtopic|political|stupid)/i.exec(classes);
    return matches && matches[1] ? matches[1] : "ontopic";
};

const getAuthor = (postElem: HTMLElement) => {
    const _elem = elemMatches(postElem, ".oneline") || elemMatches(postElem, "li");
    const username = _elem?.querySelector(`span.user a, span.oneline_user`);
    return (username as HTMLElement)?.innerText?.split(" - ")[0] || "";
};

const parsePost = (postElem: HTMLElement, limit?: number, prevParse?: ParsedReply) => {
    const post = postElem?.nodeName === "LI" ? postElem : (postElem?.parentNode as HTMLElement)?.closest("li");
    const postid = parseInt(post?.id.substr(5));
    const oneline = post?.querySelector(".oneline") as HTMLElement;
    const mod = getMod(oneline);
    const author = getAuthor(oneline);
    const body = (oneline?.querySelector(".oneline_body") as HTMLSpanElement)?.innerText;
    // detect if a post's parent is the rootpost
    const _li = document.querySelector(`li#item_${postid}`);
    const _parentLi = (<Element>_li?.parentNode)?.closest("li") as HTMLElement;
    const isRoot = elemMatches(_parentLi, "div.root > ul > li");
    return postid
        ? ({
              author,
              body,
              mod,
              postid,
              parentRef: _parentLi && !isRoot ? _parentLi : null,
          } as ParsedReply)
        : null;
};

export const getRecents = (divRootElem: HTMLElement) => {
    // find the most recent posts in a thread - newest to oldest
    let lastRecentRef: HTMLElement;
    // find the newest post then hand off to getReplyTree()
    for (let i = 0; i < 10 && !lastRecentRef; i++)
        if (!lastRecentRef) lastRecentRef = divRootElem.querySelector(`div.oneline${i}`) as HTMLElement;
    const recentRootId = lastRecentRef && parseInt(lastRecentRef.closest("div.root")?.id?.substr(5));
    // save a ref to our most recent post
    const mostRecentRef = lastRecentRef;
    // collect our parents into an array
    const recentTree = [] as ParsedReply[];
    for (let i = 0; i < 4 && lastRecentRef; i++) {
        const _parsed = parsePost(lastRecentRef);
        lastRecentRef = _parsed.parentRef;
        if (_parsed?.postid !== recentRootId) recentTree.push(_parsed);
    }
    // sort oldest to newest (as it would be rendered)
    recentTree.reverse();
    return {
        mostRecentRef,
        recentTree,
        rootid: recentRootId,
    } as Recents;
};

export const clonePostBody = (postElem: HTMLElement) => {
    const clone = postElem?.cloneNode(true) as HTMLElement;
    // clean up the postbody before processing
    const elements = [...clone?.querySelectorAll("a, div.medialink, .jt_spoiler")];
    if (arrHas(elements))
        elements.map((ml) => {
            const _linkSpan = (ml.querySelector("a > span") as HTMLSpanElement)?.innerText;
            const _linkHref = (ml as HTMLAnchorElement)?.href;
            const _spoiler = elemMatches(ml as HTMLElement, "span.jt_spoiler");
            if (_linkSpan || _linkHref) {
                // convert links to unclickable styled representations
                const linkText = _linkSpan || _linkHref;
                const replacement = document.createElement("span");
                replacement.setAttribute("class", "cs_thread_pane_link");
                replacement.innerHTML = linkText;
                ml?.replaceWith(replacement);
            } else if (_spoiler)
                // make spoiler text in cards unclickable
                ml?.removeAttribute("onclick");
        });

    const _mediamanager = clone?.querySelector("#react-media-manager");
    if (_mediamanager) _mediamanager.parentNode.removeChild(_mediamanager);
    return trimBodyHTML(clone);
};

export const parsePosts = (divThreadsElem: HTMLElement) => {
    try {
        const roots = [...divThreadsElem?.querySelectorAll("div.root")] as HTMLElement[];
        const _cards = [] as ParsedPost[];
        for (const root of roots || []) {
            const rootid = parseInt(root.getAttribute("id")?.substr(5));
            if (rootid < 1 || rootid > 50000000) throw Error(`The thread ID of ${rootid} seems bogus.`);

            const _root = rootid && (root.querySelector("ul > li.sel") as HTMLElement);
            const mod = getMod(_root?.querySelector(".fullpost"));
            const author = rootid && (_root.querySelector("div.postmeta span.user > a") as HTMLElement)?.innerText;
            const body = rootid && clonePostBody(_root.querySelector("div.postbody") as HTMLElement);
            const _posts = [..._root?.querySelectorAll("div.capcontainer li")];
            const count = _posts?.length;
            const recents = getRecents(_root);
            _cards.push({ author, body, count, mod, recents, rootid } as ParsedPost);
        }
        return _cards;
    } catch (e) {
        console.error(e);
    }
    return null;
};
