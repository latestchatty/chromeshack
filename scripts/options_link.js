if (!document.querySelector(".chromeshack_options_link")) {
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
}
