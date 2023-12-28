import { createRoot } from "react-dom/client";
import { detectMediaLink } from "../../core/api";
import { arrHas } from "../../core/common/common";
import { parseToElement } from "../../core/common/dom";
import { processPostEvent, processPostRefreshEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import "../../styles/media.css";
import { Expando } from "./Expando";

export const MediaEmbedder = {
  cachedEl: null as HTMLElement,

  install() {
    MediaEmbedder.cacheInjectables();
    processPostEvent.addHandler(MediaEmbedder.processPost);
    processPostRefreshEvent.addHandler(MediaEmbedder.processPost);
  },

  cacheInjectables() {
    const container = parseToElement(`<div id="react-media-element" />`);
    MediaEmbedder.cachedEl = container as HTMLElement;
  },

  async processPost(args: PostEventArgs) {
    const { post } = args || {};
    // don't do processing if we don't need to
    const is_enabled = await enabledContains(["media_loader", "getpost"]);
    if (!is_enabled) return;
    // render inside a hidden container in each fullpost
    const postbody = post?.querySelector(".sel > .fullpost > .postbody");
    const links = postbody && ([...postbody.querySelectorAll("a")] as HTMLAnchorElement[]);
    const openByDefault = await enabledContains(["auto_open_embeds"]);
    const rendered = [...(post?.querySelectorAll("div#react-media-element") ?? [])];
    if (rendered.length === 0 && arrHas(links)) {
      const process = async (l: HTMLAnchorElement) => {
        const childOfComic = l.closest("div.panel");
        const detected = await detectMediaLink(l.href);
        if (childOfComic || !detected) return;
        const container = MediaEmbedder.cachedEl.cloneNode(false) as HTMLElement;
        // the container needs to remain in the DOM for events to work
        postbody.append(container);
        const root = createRoot(container!);
        l.parentNode.replaceChild(container, l);
        root.render(<Expando response={detected} options={{ openByDefault }} />);
      };
      await Promise.all(links.map(process));
    }
  },
};
