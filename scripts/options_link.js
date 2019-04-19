settingsLoadedEvent.addHandler(() => {
    if (!$(".chromeshack_options_link").length) {
        var newComment = document.querySelector("#commenttools .newcomment");
        var optionsLink = $('<a>', {
            text: 'Chrome Shack Options',
            href: browser.runtime.getURL('options.html'),
            class: 'chromeshack_options_link',
            target: '_blank'
        });

        // adjust link position for both single and multi-thread mode
        var rootPostCount = document.querySelectorAll("div[id^='root_']").length;
        if (rootPostCount == 1) {
            optionsLink.addClass("singlepost");
            $("#commenttools").append(optionsLink);
        } else if (rootPostCount > 1) {
            newComment.parentNode.insertBefore(optionsLink[0], newComment.nextSibling);
        }

        // add a link next to the "Read the Rules" link in the post box
        const rules = $('p.rules');
        rules.append(
            $('<span>', {
                text: ' • ',
                class: 'postbox_rules_divider'
            })
        );
        rules.append(
            $('<a>', {
                text: 'Chrome Shack Options',
                href: browser.runtime.getURL('options.html'),
                target: '_blank'
            })
        );

        if (getSetting("enabled_scripts").contains("post_preview")) {
            rules.append(
                $('<span>', {
                    text: ' • ',
                    class: 'postbox_rules_divider'
                })
            );
            rules.append(
                $('<a>', {
                    text: 'Toggle Post/Preview Button Order',
                    href: '#',
                    class: 'toggle_post_button_order_link'
                })
            );

            processPostBoxEvent.addHandler(() => {
                const key = 'post_preview_location';
                const postButton = $('button#frm_submit')[0];
                const previewButton = $('button#previewButton')[0];

                $('a.toggle_post_button_order_link').click(() => {
                    const oldLocation = getSetting(key);
                    const newLocation = oldLocation === 'Right' ? 'Left' : 'Right';
                    console.log(oldLocation + ', setting to: ' + newLocation);
                    setSetting(key, newLocation);
                    applyLocation(newLocation);
                    reloadSettings(false);
                    return false;
                });

                applyLocation(getSetting(key));

                function applyLocation(location) {
                    const isPreviewOnLeft = previewButton.nextSibling === postButton;
                    const shouldPreviewBeOnLeft = location === 'Left';
                    if (isPreviewOnLeft !== shouldPreviewBeOnLeft) {
                        swapNodes(postButton, previewButton);
                    }
                }

                // https://stackoverflow.com/a/698440
                function swapNodes(a, b) {
                    var aparent = a.parentNode;
                    var asibling = a.nextSibling === b ? a : a.nextSibling;
                    b.parentNode.insertBefore(a, b);
                    aparent.insertBefore(b, asibling);
                }
            });
        }
    }
});

