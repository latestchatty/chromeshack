import { getSetting, setSetting, enabledContains } from "../core/settings";
import { fetchSafe } from "../core/common";

const ChattyNews = {
    async checkTime(delayInMs) {
        const curTime = new Date().getTime();
        const lastFetchTime = await getSetting("chatty_news_lastfetchtime");
        const diffTime = Math.abs(curTime - lastFetchTime);
        if (!lastFetchTime || diffTime > delayInMs) {
            // update if necessary or start fresh
            await setSetting("chatty_news_lastfetchtime", curTime);
            return true;
        }
        return false;
    },

    async populateNewsBox(container) {
        let rss = await getSetting("chatty_news_lastfetchdata");
        const cachedRSS = await getSetting("chatty_news_lastfetchdata");
        if (!cachedRSS || (await this.checkTime(1000 * 60 * 15))) {
            // cache each successful fetch for 15 minutes
            rss = await fetchSafe({
                url: "https://www.shacknews.com/feed/rss",
                parseType: { chattyRSS: true },
            });
            await setSetting("chatty_news_lastfetchdata", rss);
            //console.log("Refreshed ChattyNews cache:", rss);
        }

        const newsBox = container && container.querySelector("#recent-articles");
        for (const item of rss || []) {
            const newsItem = document.createElement("li");
            newsItem.innerHTML = /*html*/ `
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

    install() {
        enabledContains("chatty_news").then(async (res) => {
            if (res) {
                if (document.querySelector("div.chatty-news")) return;
                const articleBox = document.querySelector(".article-body p:first-child");
                let newsBox = document.createElement("div");
                newsBox.classList.add("chatty-news");
                newsBox.innerHTML = /*html*/ `
                    <h2>Recent Articles</h2>
                    <hr class="chatty-news-sep" />
                    <div><ul id="recent-articles"></ul></div>
                `;
                newsBox = await this.populateNewsBox(newsBox);
                // force parent container to align newsbox next to twitch player
                articleBox.setAttribute("style", "display: flex;");
                articleBox.appendChild(newsBox);
            }
        });
    },
};

export default ChattyNews;
