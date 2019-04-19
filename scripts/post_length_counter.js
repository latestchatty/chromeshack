settingsLoadedEvent.addHandler(() => {
    const MAX_POST_BYTES = 105;
    let updateTimer = null;

    if (getSetting("enabled_scripts").contains("post_length_counter")) {
        // script is already injected
        if ($(".post_length_counter_text").length)
            return;

        // install a div at the top of the post box
        $('div.ctextarea').after($('<div>', {
            class: 'post_length_counter_text'
        }));

        processPostBoxEvent.addHandler(() => {
            const counter = $('div.post_length_counter_text');
            const textarea = $('textarea#frm_body');

            update()

            // only update the counter when they stop typing for performance
            textarea.on('input', e => {
                if (updateTimer) {
                    clearTimeout(updateTimer);
                }
                updateTimer = setTimeout(update, 100);
            });

            function update() {
                updateTimer = null;
                const rawPostText = textarea.val();
                const postHtml = generatePreview(rawPostText);
                const postText = $('<span>' + postHtml + '</span>').text();
                const byteCount = stringToUtf8ByteArray(postText).length;
                counter.text(
                    byteCount > MAX_POST_BYTES
                    ? 'The post preview will be truncated.'
                    : 'Characters remaining in post preview: ' + (MAX_POST_BYTES - byteCount)
                );
            }
        });
    }
});
