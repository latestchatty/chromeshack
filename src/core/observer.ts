import { elemMatches, locatePostRefs } from "./common/dom";
import {
	handleRootAdded,
	processFullPosts,
	processPost,
	processPostBox,
	processUncapThread,
} from "./observer_handlers";

export const ChromeShack = {
	refreshing: [] as RefreshMutation[],

	install() {
		// use MutationObserver instead of Mutation Events for a massive performance boost
		const observer_handler = async (mutationsList: MutationRecord[]) => {
			try {
				//console.log("mutation:", mutationsList);
				for (const mutation of mutationsList) {
					const lastMutatedSibling = mutation.previousSibling as HTMLElement;
					const lastRemoved = mutation.removedNodes[0] as HTMLElement;
					const mutated = mutation.target as HTMLElement;
					// flag indicated the user has triggered a fullpost reply
					if (
						elemMatches(lastMutatedSibling, ".fullpost") &&
						elemMatches(lastRemoved, ".inlinereply")
					) {
						const parent =
							elemMatches(mutated, "li[id^='item_']") ||
							(mutated?.closest &&
								(mutated.closest("li[id^='item_'].sel.last") as HTMLElement));
						const parentid = parseInt(parent?.id?.substr(5), 10);
						const root =
							parent?.closest &&
							(parent.closest("div.root > ul > li") as HTMLElement);
						const rootid = parseInt(root?.id?.substr(5), 10);
						const foundIdx = ChromeShack.refreshing.findIndex(
							(r) => r.rootid === rootid,
						);
						// track our reply mutation based on the root thread id (like a refresh)
						if (foundIdx === -1)
							ChromeShack.refreshing.unshift({ parentid, rootid });
					}

					// check for opening capped root posts
					if (
						mutation.type === "attributes" &&
						mutation.oldValue?.indexOf("capped") > -1
					) {
						const root = mutation.target as HTMLElement;
						const rootid =
							root != undefined ? parseInt(root.id?.substr(5), 10) : -1;
						processUncapThread({ root, rootid });
					}

					for (const addedNode of mutation.addedNodes || []) {
						const added = addedNode as HTMLElement;
						const target = mutation?.target as HTMLElement;
						const postLi = elemMatches(target, "li[id^='item_']");
						const addedFullpost = postLi && elemMatches(added, "div.fullpost");
						const addedThread =
							elemMatches(target as HTMLElement, "div.threads") &&
							elemMatches(added, "div.root");
						if (addedThread) {
							// check for a thread replacement (refresh or reply)
							const rootid = parseInt(addedThread?.id?.substr(5), 10);
							const foundMutation = ChromeShack.refreshing.find(
								(r) => r.rootid === rootid,
							);
							if (foundMutation) handleRootAdded(foundMutation);
						}
						if (addedFullpost) {
							// check for opening a fullpost
							const refs = locatePostRefs(addedFullpost);
							processPost(refs);
						}
						if (elemMatches(added, "#postbox")) processPostBox(added);
					}
				}
			} catch (e) {
				console.error("A problem occurred when processing a post:", e);
			}
		};
		const observer = new MutationObserver(observer_handler);
		observer.observe(document, {
			characterData: true,
			subtree: true,
			childList: true,
			attributeFilter: ["class"],
			attributeOldValue: true,
		});
		processFullPosts();
	},
};
