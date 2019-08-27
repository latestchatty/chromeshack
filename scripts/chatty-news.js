let ChattyNews = {
    async checkTime(delayInMs) {
        let curTime = new Date().getTime();
        let lastFetchTime = await getSetting("chatty_news_lastfetchtime");
        let diffTime = Math.abs(curTime - lastFetchTime);
        if (!lastFetchTime || diffTime > delayInMs) {
            // update if necessary or start fresh
            await setSetting("chatty_news_lastfetchtime", curTime);
            return true;
        }
        return false;
    },

    async populateNewsBox(container) {
        let rss = await getSetting("chatty_news_lastfetchdata");
        let cachedRSS = await getSetting("chatty_news_lastfetchdata");
        if (!cachedRSS || await ChattyNews.checkTime(1000 * 60 * 15)) {
            // cache each successful fetch for 15 minutes
            rss = await fetchSafe({ url: "https://www.shacknews.com/feed/rss", parseType: { chattyRSS: true } });
            await setSetting("chatty_news_lastfetchdata", rss);
            //console.log("Refreshed ChattyNews cache:", rss);
        }

        let newsBox = container && container.querySelector("#recent-articles");
        for (let item of rss || []) {
            let newsItem = document.createElement("li");
            newsItem.innerHTML = /*html*/`
                <a
                    href="${item.link}"
                    title="${item.content}"
                    class="truncated"
                >
                    <span>${item.title}</span>
                </a>
            `;
            newsBox.appendChild(newsItem);
        }
        return container;
    },

    async install() {
        if (document.querySelector("div.chatty-news")) return;
        let articleBox = document.querySelector(".article-body p:first-child");
        let newsBox = document.createElement("div");
        newsBox.classList.add("chatty-news");
        newsBox.innerHTML = /*html*/`
            <h2>Recent Articles</h2>
            <hr class="chatty-news-sep" />
            <div><ul id="recent-articles"></ul></div>
        `;
        newsBox = await ChattyNews.populateNewsBox(newsBox);
        // force parent container to align newsbox next to twitch player
        articleBox.setAttribute("style", "display: flex;");
        articleBox.appendChild(newsBox);
    }
};

addDeferredHandler(enabledContains("chatty_news"), (res) => {
    if (res) ChattyNews.install();
});
