(async() => {
    if (!$(".chromeshack_options_link").length) {
        let key = await getSetting("post_preview_location");
        let ppSetting = await settingsContains("post_preview");

        const optionsLinkHandler = () => {
            let postButton = $("button#frm_submit")[0];
            let previewButton = $("button#previewButton")[0];
            const applyLocation = location => {
                const isPreviewOnLeft = previewButton.nextSibling === postButton;
                const shouldPreviewBeOnLeft = location === "Left";
                if (isPreviewOnLeft !== shouldPreviewBeOnLeft) {
                    swapNodes(postButton, previewButton);
                }
            };
            const swapNodes = (a, b) => {
                // https://stackoverflow.com/a/698440
                let aparent = a.parentNode;
                let asibling = a.nextSibling === b ? a : a.nextSibling;
                b.parentNode.insertBefore(a, b);
                aparent.insertBefore(b, asibling);
            };

            $("a.toggle_post_button_order_link").click(() => {
                const newLocation = key === "Right" ? "Left" : "Right";
                console.log(oldLocation + ", setting to: " + newLocation);
                setSetting(key, newLocation);
                applyLocation(newLocation);
                return false;
            });
            applyLocation(key);
        };

        let newComment = document.querySelector("#commenttools .newcomment");
        let optionsLink = $("<a>", {
            text: "Chrome Shack Options",
            href: browser.runtime.getURL("options.html"),
            class: "chromeshack_options_link",
            target: "_blank"
        });

        // adjust link position for both single and multi-thread mode
        let rootPostCount = document.querySelectorAll("div[id^='root_']").length;
        if (rootPostCount == 1) {
            optionsLink.addClass("singlepost");
            $("#commenttools").append(optionsLink);
        } else if (rootPostCount > 1) {
            newComment.parentNode.insertBefore(optionsLink[0], newComment.nextSibling);
        }

        // add a link next to the "Read the Rules" link in the post box
        const rules = $("p.rules");
        rules.append(
            $("<span>", {
                text: " • ",
                class: "postbox_rules_divider"
            })
        );
        rules.append(
            $("<a>", {
                text: "Chrome Shack Options",
                href: browser.runtime.getURL("options.html"),
                target: "_blank"
            })
        );

        if (ppSetting) {
            rules.append(
                $("<span>", {
                    text: " • ",
                    class: "postbox_rules_divider"
                })
            );
            rules.append(
                $("<a>", {
                    text: "Toggle Post/Preview Button Order",
                    href: "#",
                    class: "toggle_post_button_order_link"
                })
            );

            processPostBoxEvent.addHandler(optionsLinkHandler);
        }
    }
})();
