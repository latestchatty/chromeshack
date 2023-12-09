import React from "react";
import { type Root, createRoot } from "react-dom/client";
import { parseToElement } from "../../core/common/dom";
import { processPostBoxEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import "../../styles/drafts.css";
import { DraftsApp } from "./DraftsApp";

const Drafts = {
  cachedEl: null as HTMLElement,
  cachedRoot: null as Root,

  install() {
    processPostBoxEvent.addHandler(Drafts.apply);
    Drafts.cacheInjectables();
  },

  cacheInjectables() {
    const appContainer = parseToElement(`<div id="drafts__app" />`);
    Drafts.cachedEl = appContainer as HTMLElement;
  },

  async apply(args: PostboxEventArgs) {
    const { postbox } = args || {};
    const is_enabled = await enabledContains(["drafts"]);
    const positionElem = postbox?.querySelector("div.ctextarea");
    const container = postbox.querySelector("#drafts__app");
    if (is_enabled && !container && positionElem) {
      const nearestLi = postbox?.closest("li[id^='item_']");
      const postid = parseInt(nearestLi?.id?.substr(5), 10);
      const inputBox = postbox?.querySelector("#frm_body") as HTMLInputElement;

      if (!Drafts.cachedRoot) {
        const root = createRoot(Drafts.cachedEl!);
        Drafts.cachedRoot = root;
      }
      positionElem.parentElement.insertBefore(Drafts.cachedEl, positionElem.nextElementSibling);
      Drafts.cachedRoot.render(<DraftsApp postid={postid} inputBox={inputBox} />);
    }
  },
};

export { Drafts };
