import { getSetting, setSetting, enabledContains } from "../core/settings";
import { fetchSafe, safeInnerHTML, ShackRSSItem } from "../core/common";

const ChattyNews = {
    async checkTime(delayInMs: number) {
        const curTime = new Date().getTime();
        const lastFetchTime = (await getSetting("chatty_news_lastfetchtime")) as number;
        const diffTime = Math.abs(curTime - lastFetchTime);
        if (!lastFetchTime || diffTime > delayInMs) {
            // update if necessary or start fresh
            await setSetting("chatty_news_lastfetchtime", curTime);
            return true;
        }
        return false;
    },

    async populateNewsBox(container: HTMLDivElement) {
        let rss = (await getSetting("chatty_news_lastfetchdata")) as ShackRSSItem[];
        const cachedRSS = (await getSetting("chatty_news_lastfetchdata")) as ShackRSSItem[];
        if (!cachedRSS || (await ChattyNews.checkTime(1000 * 60 * 15))) {
            // cache each successful fetch for 15 minutes
            rss = await fetchSafe({
                url: "https://www.shacknews.com/feed/rss",
                parseType: { chattyRSS: true },
            });
            await setSetting("chatty_news_lastfetchdata", rss);
        }

        const newsBox = container?.querySelector("#recent-articles") as HTMLElement;
        for (const item of rss || []) {
            const newsItem = document.createElement("li");
            safeInnerHTML(
                /*html*/ `
                <a
                    href="${item.link}"
                    title="${item.content}"
                    class="truncated"
                >
                    <span>${item.title}</span>
                </a>
            `,
                newsItem,
            );
            newsBox?.appendChild(newsItem);
        }
        return container;
    },

    async install() {
        const is_enabled = await enabledContains("chatty_news");
        if (is_enabled) {
            if (document.querySelector("div.chatty-news")) return;
            const articleBox = document.querySelector(".article-content p") as HTMLElement;
            let newsBox = document.createElement("div");
            newsBox?.classList?.add("chatty-news");
            safeInnerHTML(
                /*html*/ `
                    <h2>Recent Articles</h2>
                    <hr class="chatty-news-sep" />
                    <div><ul id="recent-articles"></ul></div>
                `,
                newsBox,
            );
            newsBox = await ChattyNews.populateNewsBox(newsBox);
            // force parent container to align newsbox next to twitch player
            articleBox?.setAttribute("style", "display: flex;");
            articleBox?.appendChild(newsBox);
        }
    },
};

export default ChattyNews;
