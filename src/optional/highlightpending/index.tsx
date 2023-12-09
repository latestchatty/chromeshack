import React from "react";
import { createRoot } from "react-dom/client";
import { parseToElement } from "../../core/common/dom";
import { enabledContains } from "../../core/settings";
import "../../styles/highlight_pending.css";
import { HighlightPendingApp } from "./HighlightPendingApp";

const HighlightPendingPosts = {
  async install() {
    const isEnabled = await enabledContains(["highlight_pending_new_posts"]);
    if (!isEnabled) return;

    const isChatty = !!document.getElementById("newcommentbutton");
    const container = document.querySelector("#hpnp__app__container");
    const positionElem = document.querySelector(".header-bottom .logo.alt > a");
    if (!container && positionElem) {
      const appContainer = parseToElement(`<div id="hpnp__app__container" />`) as HTMLElement;
      // put our HPNP app next to the Shacknews logo in the top-left
      positionElem.parentElement.classList?.add("hpnp__enabled");

      const root = createRoot(appContainer);
      positionElem.append(appContainer!);
      root.render(<HighlightPendingApp threaded={isChatty} elRef={appContainer} />);
    }
  },
};

export { HighlightPendingPosts };
