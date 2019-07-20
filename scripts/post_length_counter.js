let PostLengthCounter = {
    MAX_POST_BYTES: 105,
    updateTimer: null,

    install() {
        // script is already injected
        if ($(".post_length_counter_text").length) return;
        // install a div at the top of the post box
        $("div.ctextarea").after(
            $("<div>", {
                class: "post_length_counter_text"
            })
        );

        processPostBoxEvent.addHandler(PostLengthCounter.plcHandler);
    },

    plcHandler() {
        const update = () => {
            updateTimer = null;
            const rawPostText = textarea.val();
            const postHtml = generatePreview(rawPostText);
            const postText = $("<span>" + postHtml + "</span>").text();
            // encode and count text just as submit() would
            const encodedText = EmojiPoster.handleEncoding(postText);
            const textCount = EmojiPoster.countText(encodedText);
            const astralCount = EmojiPoster.countAstrals(encodedText).astralsCount;
            const charCount = astralCount ? textCount + astralCount : textCount;
            counter.text(
                charCount > PostLengthCounter.MAX_POST_BYTES
                    ? "The post preview will be truncated."
                    : "Characters remaining in post preview: " + (PostLengthCounter.MAX_POST_BYTES - charCount)
            );
        };
        const counter = $("div.post_length_counter_text");
        const textarea = $("textarea#frm_body");
        update();

        // only update the counter when they stop typing for performance
        textarea.on("input", e => {
            if (PostLengthCounter.updateTimer) {
                clearTimeout(PostLengthCounter.updateTimer);
            }
            PostLengthCounter.updateTimer = setTimeout(update, 100);
        });
    }
};

PostLengthCounter.install();
