import { parseToElement } from "../core/common/dom";
import { fullPostsCompletedEvent } from "../core/events";
import { getEnabledBuiltin } from "../core/settings";

export const DiscordLink = {
  cachedEl: null as HTMLElement | null,

  cacheInjectables() {
    const el = parseToElement(`
      <a
        class="chatty-lold-home-page-link discord-btn"
        href="https://discord.gg/thechatty"
      >
        DISCORD
      </a>
    `);
    DiscordLink.cachedEl = el as HTMLElement;
  },

  apply() {
    const discordBtnEl = document.querySelector("a.discord-btn");
    if (discordBtnEl) return;

    // place the shortcut next to the "LOL PAGE" button on Chatty
    const lolButtonEl = document.querySelector("a.chatty-lold-home-page-link");
    if (lolButtonEl) {
      const discordLinkEl = DiscordLink.cachedEl?.cloneNode(true) as HTMLElement;
      if (discordLinkEl) {
        lolButtonEl.parentNode?.insertBefore(discordLinkEl, lolButtonEl);
      }
    }
  },

  async install() {
    const isEnabled = await getEnabledBuiltin("discord_link");
    if (!isEnabled) return;

    DiscordLink.cacheInjectables();
    fullPostsCompletedEvent.addHandler(DiscordLink.apply);
  },
};
