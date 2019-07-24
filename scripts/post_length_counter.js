let PostLengthCounter = {
    MAX_POST_BYTES: 105,
    updateTimer: null,

    install() {
        // script is already injected
        if (document.querySelector(".post_length_counter_text")) return;
        // install a div at the top of the post box
        let position = document.querySelector("div.csubmit");
        let child = document.createElement("div");
        child.setAttribute("class", "post_length_counter_text");
        position.parentNode.insertBefore(child, position);
        processPostBoxEvent.addHandler(PostLengthCounter.plcHandler);
    },

    update() {
        let counter = document.querySelector("div.post_length_counter_text");
        let textarea = document.querySelector("textarea#frm_body");
        let rawPostText = textarea.value;
        let encodedText = EmojiPoster.handleEncoding(rawPostText);
        let textCount = EmojiPoster.countText(encodedText);
        let astralCount = EmojiPoster.countAstrals(encodedText).astralsCount;
        let charCount = astralCount ? textCount + astralCount : textCount;
        counter.innerText = charCount > PostLengthCounter.MAX_POST_BYTES ?
            "The post preview will be truncated." :
            `Characters remaining in post preview: ${(PostLengthCounter.MAX_POST_BYTES - charCount)}`;
    },

    delayedUpdate() {
        if (PostLengthCounter.updateTimer) clearTimeout(PostLengthCounter.updateTimer);
        PostLengthCounter.updateTimer = setTimeout(PostLengthCounter.update, 250);
    },

    plcHandler() {
        PostLengthCounter.update();
        // only update the counter when they stop typing for performance
        document.querySelector("textarea#frm_body")
            .addEventListener("keyup", PostLengthCounter.delayedUpdate);
    }
};

PostLengthCounter.install();
