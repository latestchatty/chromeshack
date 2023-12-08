import { useCallback, useEffect, useState } from "react";
import { arrHas } from "../../core/common/common";
import { scrollToElement } from "../../core/common/dom";
import {
	hpnpJumpToPostEvent,
	pendingPostsUpdateEvent,
	processNotifyEvent,
	processPostRefreshEvent,
} from "../../core/events";
import { getSetting } from "../../core/settings";

const isCollapsed = (elem: HTMLElement) => elem?.closest("div.root.collapsed");
const isPending = (elem: HTMLElement) =>
	elem?.matches("a.refresh_pending") && elem?.closest("div.refresh a") === elem;

const usePendingPosts = (threaded: boolean) => {
	const [pendings, setPendings] = useState([] as PendingPost[]);
	const [pendingText, setPendingText] = useState("");
	const [pendingIdx, setPendingIdx] = useState(0);
	const [count, setCount] = useState(0);
	const indicator = "★ ";

	const handlePrevClick = useCallback(() => {
		if (!arrHas(pendings)) return;
		const newIdx = (pendingIdx - 1 + pendings.length) % pendings.length;
		const threadid = pendings[newIdx]?.threadId;
		const thread = pendings[newIdx]?.thread;
		setPendingIdx(newIdx);
		if (thread) {
			scrollToElement(thread, { toFit: true });
			hpnpJumpToPostEvent.raise({ threadid });
		}
	}, [pendings, pendingIdx]);
	const handleNextClick = useCallback(() => {
		if (!arrHas(pendings)) return;
		const newIdx = (pendingIdx + 1 + pendings.length) % pendings.length;
		const threadid = pendings[newIdx]?.threadId;
		const thread = pendings[newIdx]?.thread;
		setPendingIdx(newIdx);
		if (thread) {
			scrollToElement(thread, { toFit: true });
			hpnpJumpToPostEvent.raise({ threadid });
		}
	}, [pendings, pendingIdx]);

	const updateRefreshed = useCallback(
		({ post }: PostEventArgs) => {
			// update the list of pending posts when one of them is refreshed
			const threadid = parseInt(
				post?.closest("div.root > ul > li[id^='item_']")?.id?.substring(5),
				10,
			);
			const filtered = pendings.filter((p) => p.threadId !== threadid);
			const newIdx = filtered.length - 1 > 0 ? filtered.length - 1 : 0;
			const newPendings = arrHas(filtered) ? [...filtered] : [];
			setPendings(newPendings);
			setCount(newPendings.length);
			// avoid going OOB if the stack shrinks
			setPendingIdx((i) => (i > newIdx ? newIdx : i));
			pendingPostsUpdateEvent.raise({ pendings: newPendings });
		},
		[pendings],
	);
	const fetchPendings = useCallback(
		async (resp: NotifyResponse) => {
			const newPosts = arrHas(resp.events)
				? [...resp.events.filter((x: NotifyEvent) => x.eventType === "newPost")]
				: [];
			// build new pendings on top of old ones as long as they're unique threads
			const loggedUser = (await getSetting("username")) as string;
			const reducedPosts = newPosts.reduce(
				(acc, p) => {
					const eventData = p.eventData as NewPostData;
					const postId = eventData?.postId;
					const threadId = eventData?.post?.threadId;
					const thread = document.querySelector(
						`li#item_${threadId}`,
					) as HTMLElement;
					const isAuthorMe =
						eventData?.post?.author?.toLowerCase() ===
						loggedUser?.toLowerCase();
					// don't grab new posts that contain our logged-in user as the author
					if (thread && !isAuthorMe) acc.push({ postId, threadId, thread });
					return acc;
				},
				[] as PendingPost[],
			);
			const reducedPendings = reducedPosts.reduce((acc, p) => {
				const found = acc.find((x) => x.threadId === p.threadId);
				if (!found) acc.push(p);
				// adjust our pending count contextually
				if (!threaded) setCount((_p) => _p + 1);
				else setCount(acc.length);
				return acc;
			}, pendings);
			setPendings([...reducedPendings]);
			pendingPostsUpdateEvent.raise({ pendings: reducedPendings });
		},
		[threaded, pendings],
	);

	useEffect(() => {
		// update the window title and HPNP status text when our pending count changes
		const newText =
			count > 0 && threaded
				? `${count}`
				: count > 0 && !threaded
				  ? `${indicator}${count}`
				  : "";
		setPendingText(newText);
		if (pendings.length > 0 && !document.title.startsWith(indicator))
			document.title = `${indicator}${document.title}`;
		else if (pendings.length === 0 && document.title.startsWith(indicator))
			document.title = document.title.split(indicator)[1];
		// highlight the refresh button of unmarked threads that have pending posts
		for (const p of pendings || []) {
			const refreshBtn = p.thread?.querySelector(
				"div.refresh a",
			) as HTMLElement;
			if (!isCollapsed(refreshBtn) && !isPending(refreshBtn))
				refreshBtn?.classList?.add("refresh_pending");
		}
	}, [threaded, count, pendings]);
	useEffect(() => {
		processNotifyEvent.addHandler(fetchPendings);
		processPostRefreshEvent.addHandler(updateRefreshed);
		return () => {
			processNotifyEvent.removeHandler(fetchPendings);
			processPostRefreshEvent.removeHandler(updateRefreshed);
		};
	}, [fetchPendings, updateRefreshed]);

	return { pendings, pendingText, handlePrevClick, handleNextClick };
};

export { usePendingPosts };
