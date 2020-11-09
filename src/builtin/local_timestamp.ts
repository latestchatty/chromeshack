import { processPostEvent, processPostRefreshEvent } from "../core/events";

export const LocalTimeStamp = {
    date: new Date(),
    dateOpts: {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZoneName: "short",
    },

    install() {
        processPostRefreshEvent.addHandler(LocalTimeStamp.adjustTime);
        processPostEvent.addHandler(LocalTimeStamp.adjustTime);
    },

    fixTime(rawDateStr: string) {
        // from: Sep 16, 2020 5:24pm PDT (server)
        // to: Sep 16, 2020, 6:24PM MDT (client)
        // NOTE: The Chatty page can report wrong timestamps due to a backend server bug
        try {
            const fixAMPM = rawDateStr.replace(/(am\s|pm\s)/, (m1) => ` ${m1.toUpperCase()}`);
            LocalTimeStamp.date.setTime(Date.parse(fixAMPM));
            // use native JS to format a date string
            const toStr = LocalTimeStamp.date.toLocaleDateString("en", LocalTimeStamp.dateOpts);
            return toStr ? toStr : rawDateStr;
        } catch (e) {
            console.error(e);
        }
    },

    replaceTime(dateStr: string, postDate: HTMLElement) {
        const timeText = document.createTextNode(dateStr);
        // either a fullpost with a timer or a reply without one
        const textNode = postDate?.childNodes[1] || postDate?.childNodes[0];
        if (textNode?.nodeType === 3) textNode.parentNode.replaceChild(timeText, textNode);
    },

    adjustPostTime({ post }: PostEventArgs) {
        const dateStr = post?.textContent;
        const fixedTime = dateStr && LocalTimeStamp.fixTime(dateStr);
        const is_corrected = post?.classList?.contains("timestamp_corrected");
        if (fixedTime && !is_corrected) {
            LocalTimeStamp.replaceTime(fixedTime, post);
            post.classList?.add("timestamp_corrected");
        }
    },

    adjustTime(args: PostEventArgs) {
        const { post, root } = args || {};
        // change dates per given root
        const postDate = post?.querySelector(".postdate") as HTMLElement;
        const rootDate = root?.querySelector(".postdate") as HTMLElement;
        if (postDate) LocalTimeStamp.adjustPostTime({ post: postDate });
        if (rootDate) LocalTimeStamp.adjustPostTime({ post: postDate });
    },
};
