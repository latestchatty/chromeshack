/*
 *  Attempt to workaround Chatty's nuLOL API data not loading after replying
 */

processReplyEvent.addHandler((item, root) => {
    let rootPostRefreshBtn = root.querySelector(".fullpost.op .refresh > a");
    let refreshedOL = item.querySelector("span.oneline_body");
    let refreshedBtn = item.querySelector(".refresh > a");
    let threadsContainer = document.querySelector(".threads");
    let rootId = root.id.substr(5);
    const replyHandler = () => {
        processTagDataLoadedEvent.removeHandler(replyHandler);
        addDatasetVal(threadsContainer, "refreshed", rootId);
        refreshedOL.click();
        refreshedBtn.click();
        if (!elementIsVisible(item)) scrollToElement(item);
    };
    if (refreshedBtn && rootPostRefreshBtn) {
        // 1) force a refresh of all tag data for this root thread
        // 2) re-open the oneliner of the new reply
        // 3) force a refresh of the open reply
        // 4) ensure the reply is visible
        processTagDataLoadedEvent.addHandler(replyHandler);
        rootPostRefreshBtn.click();
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
    const refreshHandler = () => {
        processTagDataLoadedEvent.removeHandler(refreshHandler);
        addDatasetVal(threadsContainer, "refreshed", rootId);
        refreshedOL.click();
    };
    // avoid reprocessing already refreshed thread upon mutation (also catches post-reply refreshes)
    if (datasetHas(threadsContainer, "refreshed", rootId))
        removeDatasetVal(threadsContainer, "refreshed", rootId);
    else if (refreshedBtn && rootPostRefreshBtn && item !== root) {
        // similar to the reply workaround except we avoid scrolling
        processTagDataLoadedEvent.addHandler(refreshHandler);
        rootPostRefreshBtn.click();
    }
});
