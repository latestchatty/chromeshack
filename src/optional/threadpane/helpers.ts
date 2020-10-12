import { arrHas, elementFitsViewport, elemMatches, scrollParentToChild, scrollToElement } from "../../core/common";
import type { JumpToPostArgs, ParsedPost, ParsedReply, Recents } from "./index.d";

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

export const jumpToPost = (args: JumpToPostArgs) => {
    const { postid, rootid, options } = args || {};
    const { cardFlash, postFlash, scrollParent, scrollPost, collapsed } = options || {};
    const liElem = postid && (document.querySelector(`li#item_${postid}`) as HTMLLIElement);
    const divRoot = rootid && (document.querySelector(`div.root#root_${rootid}`) as HTMLDivElement);
    const card = rootid && (document.querySelector(`div#item_${rootid}`) as HTMLDivElement);
    const cardList = card?.closest("div#cs_thread_pane") as HTMLElement;
    if (divRoot && scrollPost && elementFitsViewport(divRoot)) scrollToElement(divRoot, true);
    else if (scrollPost && (liElem || divRoot)) scrollToElement(liElem || divRoot);
    else if (scrollParent && card) scrollParentToChild(cardList, card);
    if (collapsed !== undefined && collapsed && divRoot) divRoot.classList.remove("capped");
    if (cardFlash && card) flashCard(card);
    if (postFlash && divRoot) flashPost(divRoot, liElem);
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
    const _elem =
        elemMatches(postElem, "div.root > ul > li, div.root") ||
        elemMatches(postElem, ".oneline") ||
        elemMatches(postElem, "li");
    const username = _elem?.querySelector("span.user a, span.oneline_user");
    return (username as HTMLElement)?.innerText?.split(" - ")[0] || "";
};

const parseReply = (postElem: HTMLElement) => {
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
    // find the most recent post in ascending age
    for (let i = 0; i < 10 && !lastRecentRef; i++)
        if (!lastRecentRef) lastRecentRef = divRootElem.querySelector(`div.oneline${i}`) as HTMLElement;
    const recentRootId = lastRecentRef && parseInt(lastRecentRef.closest("div.root")?.id?.substr(5));
    const mostRecentRef = lastRecentRef;
    // walk up the reply tree to a distance limit of 4 parents
    const recentTree = [] as ParsedReply[];
    for (let i = 0; i < 4 && lastRecentRef; i++) {
        const _parsed = parseReply(lastRecentRef);
        lastRecentRef = _parsed.parentRef;
        // put our replies in render order (oldest to newest)
        if (_parsed?.postid !== recentRootId) recentTree.unshift(_parsed);
    }
    return {
        mostRecentRef,
        recentTree,
        rootid: recentRootId,
    } as Recents;
};

export const clonePostBody = (postElem: HTMLElement) => {
    // post body is empty (probably nuked)
    if (postElem?.innerText.length === 0) return null;
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

const parseRoot = (rootElem: HTMLElement) => {
    const root = elemMatches(rootElem, "div.root");
    const rootid = root && parseInt(root?.id?.substr(5));
    if (rootid < 1 || rootid > 50000000) {
        console.error(`The thread ID of ${rootid} seems bogus.`);
        return null;
    }
    const rootLi = root?.querySelector("ul > li.sel") as HTMLElement;
    const author = getAuthor(rootLi);
    const body = clonePostBody(root?.querySelector("div.postbody") as HTMLElement);
    if (!author || !body) {
        console.error(`Encountered what looks like a nuked post:`, rootid, root);
        return null;
    }
    const mod = getMod(rootLi?.querySelector(".fullpost"));
    const count = [...rootLi?.querySelectorAll("div.capcontainer li")]?.length;
    const recents = getRecents(root);
    return { author, body, count, mod, recents, rootid } as ParsedPost;
};

export const parsePosts = (divThreadsElem: HTMLElement) => {
    try {
        const roots = [...divThreadsElem?.querySelectorAll("div.root")] as HTMLElement[];
        return roots?.reduce((acc, r) => {
            const parsed = parseRoot(r);
            if (parsed) acc.push(parsed);
            return acc;
        }, [] as ParsedPost[]);
    } catch (e) {
        console.error(e);
    }
    return null;
};
