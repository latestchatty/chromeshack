/*
 *  Attempt to workaround Chatty's nuLOL API data not loading after replying
 */

processReplyEvent.addHandler((item, root) => {
    console.log("processReplyEvent:", item, root);
    let rootPostRefreshBtn = root.querySelector(".fullpost.op .refresh > a");
    let refreshedOL = item.querySelector("span.oneline_body");
    let refreshedBtn = item.querySelector(".refresh > a");
    // try to fix busted nuLOL tag data loading when replying
    if (rootPostRefreshBtn) {
        // 1) force a refresh of all tag data for this root thread
        // 2) re-open the oneliner of the new reply
        // 3) refresh the tag data for the new reply
        // 4) ensure the reply is visible
        delayPromise(0)
            .then(Promise.resolve(rootPostRefreshBtn.click()))
            .then(delayPromise(250)
                .then(Promise.resolve(refreshedOL.click()))
                .then(Promise.resolve(refreshedBtn.click()))
                .then(Promise.resolve(scrollToElement(item)))
            )
        .catch(e => console.log("Something went wrong:", e))
    }
});
