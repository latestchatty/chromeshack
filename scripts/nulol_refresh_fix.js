/*
 *  Attempt to workaround Chatty's nuLOL API data not loading after replying
 */

processReplyEvent.addHandler((item, root) => {
    let rootPostRefreshBtn = root.querySelector(".fullpost.op .refresh > a");
    let refreshedOL = item.querySelector("span.oneline_body");
    let refreshedBtn = item.querySelector(".refresh > a");
    let threadsContainer = document.querySelector(".threads");
    let rootId = root.id.substr(5);
    if (refreshedBtn && rootPostRefreshBtn) {
        // try to fix busted nuLOL tag data loading when replying
        // 1) force a refresh of all tag data for this root thread
        // 2) re-open the oneliner of the new reply
        // 3) refresh the tag data for the new reply
        // 4) ensure the reply is visible
        delayPromise(0)
            .then(Promise.resolve(rootPostRefreshBtn.click()))
            .then(delayPromise(250)
                .then(Promise.resolve(refreshedOL.click()))
                .then(Promise.resolve(refreshedBtn.click()))
                .then(Promise.resolve(addDatasetVal(threadsContainer, "refreshed", rootId)))
                .then(Promise.resolve(scrollToElement(item)))
            )
        .catch(e => console.log("Something went wrong after reply:", e))
    }
});

/*
 *  Attempt to workaround busted nuLOL API data loading behavior when refreshing
 */
processRefreshEvent.addHandler((item, root) => {
    let rootPostRefreshBtn = root.querySelector(".fullpost.op .refresh > a");
    let refreshedOL = item.querySelector("span.oneline_body");
    let refreshedBtn = item.querySelector(".refresh > a");
    let threadsContainer = document.querySelector(".threads");
    let rootId = root.id.substr(5);
    // avoid reprocessing already refreshed thread upon mutation (also catches replies)
    if (datasetHas(threadsContainer, "refreshed", rootId))
        removeDatasetVal(threadsContainer, "refreshed", rootId);
    else if (refreshedBtn && rootPostRefreshBtn) {
        delayPromise(0)
            .then(Promise.resolve(rootPostRefreshBtn.click()))
            .then(delayPromise(250)
                .then(Promise.resolve(refreshedOL.click()))
                .then(Promise.resolve(refreshedBtn.click()))
                .then(Promise.resolve(addDatasetVal(threadsContainer, "refreshed", rootId)))
            )
        .catch(e => console.log("Something went wrong after refresh:", e))
    }
});
