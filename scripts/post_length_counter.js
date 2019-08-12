let PostLengthCounter = {
    MAX_POST_BYTES: 105,
    updateTimer: null,

    install(item) {
        // script is already injected
        if (item.querySelector(".post_length_counter_text")) return;
        // install a div at the top of the post box
        let position = item.querySelector("div.csubmit");
        let child = document.createElement("div");
        if (!position) return;
        child.setAttribute("class", "post_length_counter_text");
        position.parentNode.insertBefore(child, position);
        processPostBoxEvent.addHandler(PostLengthCounter.plcHandler(item));
    },

    update(item) {
        let counter = item.querySelector("div.post_length_counter_text");
        let textarea = item.querySelector("textarea#frm_body");
        let rawPostText = textarea && textarea.value;
        let encodedText = rawPostText && EmojiPoster.handleEncoding(rawPostText);
        let textCount = encodedText && EmojiPoster.countText(encodedText);
        let astralCount = encodedText && EmojiPoster.countAstrals(encodedText).astralsCount;
        let charCount = astralCount ? textCount + astralCount : textCount;
        if (counter)
            counter.innerText = charCount > PostLengthCounter.MAX_POST_BYTES ?
                "The post preview will be truncated." :
                `Characters remaining in post preview: ${(PostLengthCounter.MAX_POST_BYTES - charCount)}`;
    },

    plcHandler(item) {
        PostLengthCounter.update(item);
        // only update the counter when they stop typing for performance
        item.querySelector("textarea#frm_body")
            .addEventListener("keyup", () => {
                if (PostLengthCounter.updateTimer) clearTimeout(PostLengthCounter.updateTimer);
                PostLengthCounter.updateTimer = setTimeout(PostLengthCounter.update(item), 250);
            });
    }
};

processPostBoxEvent.addHandler(PostLengthCounter.install);
