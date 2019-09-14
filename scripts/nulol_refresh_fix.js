/*
 *  Attempt to workaround Chatty's nuLOL API data not loading after replying/refreshing
 */

processReplyEvent.addHandler((item, root) => {
    let post = item.matches("div.threads li[id^='item_']") && item;
    let _root = root.matches("div.threads .root > ul > li") && root;
    // pass the event info along to the refresh event below
    if (post) processRefreshEvent.raise(post, _root);
});

processRefreshEvent.addHandler((item, root, override) => {
    let threadsContainer = document.querySelector(".threads");
    let refreshedId = item.id.substr(5);
    let rootId = root.id.substr(5);
    const tagsLoadedHandler = (target) => {
        processTagDataLoadedEvent.removeHandler(tagsLoadedHandler);
        if (!elementIsVisible(target)) scrollToElement(target);
    };
    const refreshHandler = () => {
        let refreshed = document.querySelector(`div.threads li#item_${refreshedId}`);
        let refreshedOL = refreshed && refreshed.querySelector("span.oneline_body");
        processTagDataLoadedEvent.removeHandler(refreshHandler);
        addDatasetVal(threadsContainer, "refreshed", rootId);
        processTagDataLoadedEvent.addHandler(() => tagsLoadedHandler(refreshed));
        refreshedOL.click();
    };
    // avoid reprocessing already refreshed thread upon mutation
    if (datasetHas(threadsContainer, "refreshed", rootId))
        removeDatasetVal(threadsContainer, "refreshed", rootId);
    else if (item !== root || override) {
        let rootPostRefreshBtn = root.querySelector(".fullpost.op .refresh > a");
        processTagDataLoadedEvent.addHandler(refreshHandler);
        rootPostRefreshBtn.click();
    }
});
