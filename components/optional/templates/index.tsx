import { StrictMode } from "react";
import { type Root, createRoot } from "react-dom/client";
import { parseToElement } from "../../core/common/dom";
import { processPostBoxEvent } from "../../core/events";
import { enabledContains } from "../../core/settings";
import { TemplatesApp } from "./TemplatesApp";

const Templates = {
  cachedEl: null as HTMLElement | null,
  cachedRoot: null as Root | null,

  install() {
    processPostBoxEvent.addHandler(Templates.apply);
    Templates.cacheInjectables();
  },

  cacheInjectables() {
    const appContainer = parseToElement(`<div id="templates__app" />`);
    Templates.cachedEl = appContainer as HTMLElement;
  },

  async apply(args: PostboxEventArgs) {
    const { postbox } = args || {};
    const is_enabled = await enabledContains(["templates"]);
    const positionElem = postbox?.querySelector("div.csubmit");
    const container = postbox.querySelector("#templates__app");
    if (is_enabled && !container && positionElem) {
      const inputBox = postbox?.querySelector("#frm_body") as HTMLInputElement;

      if (!Templates.cachedRoot) {
        const root = createRoot(Templates.cachedEl!);
        Templates.cachedRoot = root;
      }
      positionElem.append(Templates.cachedEl!);
      Templates.cachedRoot.render(
        <StrictMode>
          <TemplatesApp inputBox={inputBox} />
        </StrictMode>,
      );
    }
  },
};

export { Templates };
