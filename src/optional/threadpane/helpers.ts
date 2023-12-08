import { Collapse } from "../../builtin/collapse";
import {
	elemMatches,
	elementFitsViewport,
	scrollParentToChild,
	scrollToElement,
} from "../../core/common/dom";

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
	const {
		cardFlash,
		collapsed,
		postFlash,
		scrollParent,
		scrollPost,
		toFit,
		uncap,
	} = options || {};
	const liElem =
		postid && (document.querySelector(`li#item_${postid}`) as HTMLLIElement);
	const divRoot =
		rootid &&
		(document.querySelector(`div.root#root_${rootid}`) as HTMLDivElement);
	const card =
		rootid && (document.querySelector(`div#item_${rootid}`) as HTMLDivElement);
	const cardList = card?.closest("div#cs_thread_pane") as HTMLElement;
	if ((uncap && !collapsed && divRoot) || (uncap && divRoot))
		divRoot.classList.remove("capped");
	if (scrollPost && divRoot && elementFitsViewport(divRoot))
		scrollToElement(divRoot, { toFit: true });
	else if (scrollPost && (liElem || divRoot))
		scrollToElement(liElem || divRoot, { toFit });
	else if (scrollParent && card) scrollParentToChild(cardList, card);
	if (cardFlash && card) flashCard(card);
	if (postFlash && divRoot) flashPost(divRoot, liElem);
};

const trimBodyHTML = (elem: HTMLElement) =>
	elem?.innerHTML
		?.replace(/[\r\n]/gm, "") // strip newlines, we only need the <br>s
		.replace(/\<br\>/gm, " "); // strip <br>s

export const threadContainsLoggedUser = (rootEl: HTMLElement, user: string) => {
	if (!user) return false;
	const oneliners = [...(rootEl?.querySelectorAll(".oneline_user") ?? [])];
	for (const oneline of oneliners || [])
		if (oneline.textContent.toLowerCase() === user.toLowerCase()) return true;

	return false;
};

const getMod = (postElem: HTMLElement) => {
	const classes = postElem?.classList?.toString();
	if (classes.indexOf("_informative") > -1) return "informative";
	else if (classes.indexOf("_nws") > -1) return "nws";
	else if (classes.indexOf("_offtopic") > -1) return "offtopic";
	else if (classes.indexOf("_political") > -1) return "political";
	else if (classes.indexOf("_stupid") > -1) return "stupid";
	return "ontopic";
};

const getAuthor = (postElem: HTMLElement) => {
	const _elem =
		elemMatches(postElem, "div.root > ul > li, div.root") ||
		elemMatches(postElem, ".oneline") ||
		elemMatches(postElem, "li");
	const username = _elem?.querySelector("span.user a, span.oneline_user");
	return (username as HTMLElement)?.textContent?.split(" - ")[0] || "";
};

export const parseReply = (postElem: HTMLElement) => {
	const post =
		postElem?.nodeName === "LI"
			? postElem
			: (postElem?.parentNode as HTMLElement)?.closest("li");
	const postid = parseInt(post?.id.substring(5), 10);
	const oneline = post?.querySelector(".oneline") as HTMLElement;
	const authorid = parseInt(
		oneline?.getAttribute("class")?.split("olauthor_")?.[1],
		10,
	);
	const mod = getMod(oneline);
	const author = getAuthor(oneline);
	const body = (oneline?.querySelector(".oneline_body") as HTMLSpanElement)
		?.textContent;
	// detect if a post's parent is the rootpost
	const _li = document.querySelector(`li#item_${postid}`);
	const _parentLi = (_li?.parentNode as Element)?.closest("li") as HTMLElement;
	const isRoot = elemMatches(_parentLi, "div.root > ul > li");
	const op = !!elemMatches(oneline, ".op");
	return postid
		? ({
				author,
				authorid,
				body,
				mod,
				op,
				postid,
				parentRef: _parentLi && !isRoot ? _parentLi : null,
		  } as ParsedReply)
		: null;
};

export const getRecents = (divRootElem: HTMLElement) => {
	// find the most recent posts in a thread - newest to oldest
	let lastRecentRef: HTMLElement;
	// find the most recent post in ascending age
	for (let i = 0; i < 10 && !lastRecentRef; i++) {
		const recent = divRootElem.querySelector(`div.oneline${i}`) as HTMLElement;
		if (recent) lastRecentRef = recent;
	}
	const recentRootId =
		lastRecentRef &&
		parseInt(lastRecentRef.closest("div.root")?.id?.substring(5), 10);
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
	// clean up the postbody before processing
	// post body is empty (probably nuked)
	if (postElem?.textContent.length === 0) return null;
	const clone = postElem?.cloneNode(true) as HTMLElement;
	const elements = [
		...(clone?.querySelectorAll("a, div.medialink, .jt_spoiler") ?? []),
	];
	for (const element of elements || []) {
		const _linkSpan = (element.querySelector("a > span") as HTMLSpanElement)
			?.textContent;
		const _linkHref = (element as HTMLAnchorElement)?.href;
		const _spoiler = element?.matches("span.jt_spoiler");
		if (_linkSpan || _linkHref) {
			// convert links to unclickable styled representations
			const linkText = _linkSpan || element.textContent || _linkHref;
			const replacement = document.createElement("span");
			replacement.setAttribute("class", "cs_thread_pane_link");
			replacement.textContent = linkText;
			element?.replaceWith(replacement);
		} else if (_spoiler)
			// make spoiler text in cards unclickable
			element?.removeAttribute("onclick");
	}
	const _mediamanager = clone?.querySelector("#react-media-manager");
	if (_mediamanager) _mediamanager.parentNode.removeChild(_mediamanager);
	const trimmed = trimBodyHTML(clone);
	return trimmed;
};

export const parseRoot = (rootElem: HTMLElement, user: string) => {
	const root = elemMatches(rootElem, "div.root");
	const rootid = root && parseInt(root?.id?.substring(5), 10);
	// try to return early for threads with invalid ids
	if (rootid < 1 || rootid > 50000000) {
		console.error(`The thread ID of ${rootid} seems bogus.`);
		return null;
	}
	const rootLi = root?.querySelector("ul > li.sel") as HTMLElement;
	const fullpost = rootLi?.querySelector(".fullpost") as HTMLElement;
	const authorid = parseInt(
		fullpost.getAttribute("class")?.split("fpauthor_")?.[1],
		10,
	);
	const author = getAuthor(rootLi);
	const body = clonePostBody(
		root?.querySelector("div.postbody") as HTMLElement,
	);
	const count = [...(rootLi?.querySelectorAll("div.capcontainer li") ?? [])]
		?.length;
	// return blank cards for potentially invalid root posts
	if ((!author && !body) || !author || (!body && count === 0)) {
		console.error(
			"Encountered what looks like a nuked or invalid post:",
			rootid,
			root,
		);
		return null;
	}
	const mod = getMod(fullpost);
	const recents = getRecents(root);
	const contained = threadContainsLoggedUser(rootElem, user);
	const collapsed = !!Collapse.findCollapsed(rootid);
	return {
		author,
		authorid,
		body,
		contained,
		count,
		mod,
		recents,
		rootid,
		collapsed,
	} as ParsedPost;
};
