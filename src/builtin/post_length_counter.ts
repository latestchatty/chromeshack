import { processPostBoxEvent } from "../core/events";
import { EmojiPoster } from "../builtin/emoji_poster";

export const PostLengthCounter = {
    MAX_POST_BYTES: 105,
    updateTimer: null as ReturnType<typeof setTimeout>,

    install() {
        processPostBoxEvent.addHandler(PostLengthCounter.install);
    },

    apply(item: HTMLElement) {
        // script is already injected
        if (item.querySelector(".post_length_counter_text")) return;
        // install a div at the top of the post box
        const position = item.querySelector("div.csubmit");
        const child = document.createElement("div");
        if (!position) return;
        child.setAttribute("class", "post_length_counter_text");
        position.parentNode.insertBefore(child, position);
        processPostBoxEvent.addHandler(() => PostLengthCounter.plcHandler(item));
    },

    update(item: HTMLElement) {
        const counter = item?.querySelector("div.post_length_counter_text") as HTMLElement;
        const textarea = item?.querySelector("textarea#frm_body") as HTMLInputElement;
        const rawPostText = textarea?.value;
        const encodedText = rawPostText && EmojiPoster.handleEncoding(rawPostText);
        const textCount = encodedText && EmojiPoster.countText(encodedText);
        const astralCount = encodedText && EmojiPoster.countAstrals(encodedText).astralsCount;
        const charCount = astralCount ? textCount + astralCount : textCount;
        if (counter) {
            counter.innerText =
                charCount > PostLengthCounter.MAX_POST_BYTES
                    ? "The post preview will be truncated."
                    : `Characters remaining in post preview: ${PostLengthCounter.MAX_POST_BYTES - charCount}`;
        }
    },

    plcHandler(item: HTMLElement) {
        PostLengthCounter.update(item);
        // only update the counter when they stop typing for performance
        item.querySelector("textarea#frm_body").addEventListener("keyup", () => {
            if (PostLengthCounter.updateTimer) clearTimeout(PostLengthCounter.updateTimer);
            PostLengthCounter.updateTimer = setTimeout(PostLengthCounter.update, 250);
        });
    },
};
