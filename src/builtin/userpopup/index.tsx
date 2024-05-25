import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { elemMatches, parseToElement } from "../../core/common/dom";
import { processPostEvent, userPopupEvent } from "../../core/events";
import { getUsername } from "../../core/notifications";
import "../../styles/userpopup.css";
import { UserPopupApp } from "./UserPopupApp";
import { getEnabledBuiltin } from "../../core/settings";

export const UserPopup = {
  cachedEl: null as HTMLElement | null,

  async install() {
    const isEnabled = await getEnabledBuiltin("user_popup");
    if (!isEnabled) return;

    document.addEventListener("click", UserPopup.clickHandler);
    userPopupEvent.addHandler(UserPopup.userPopupEventHandler);
    processPostEvent.addHandler(UserPopup.setup);
    UserPopup.cacheInjectables();
  },

  setup({ post }: PostEventArgs) {
    // show some proof we exist for testing purposes
    const userLink = post?.querySelector("span.user");
    if (userLink) userLink.classList.add("enhanced");
  },

  cacheInjectables() {
    const appContainer = parseToElement(`<div class="userDropdown" />`);
    UserPopup.cachedEl = appContainer as HTMLElement;
  },

  userPopupEventHandler({ root }: UserPopupEventArgs) {
    if (root != null) root.unmount();
  },

  async clickHandler(e: MouseEvent) {
    const _this = e?.target as HTMLElement;
    const isLoggedIn = document.querySelector("li#user_posts");
    // cover both logged-in and logged-out cases
    const loggedOutLink = !isLoggedIn ? (elemMatches(_this, "span.user")?.childNodes?.[0] as HTMLSpanElement) : null;
    const loggedInLink = isLoggedIn ? (elemMatches(_this, "span.user > a") as HTMLAnchorElement) : null;
    const accountLink = _this && elemMatches(_this, "header .header-bottom .tools ul li a[href='/settings']");
    const accountName = accountLink
      ? (accountLink?.parentNode?.parentNode?.querySelector("#user_posts") as HTMLLIElement)?.textContent
      : "";
    accountLink?.setAttribute("id", "userDropdownTrigger");

    if (loggedInLink || loggedOutLink || accountLink) {
      e.preventDefault();
      const _username = (loggedInLink || loggedOutLink)?.textContent?.trim() || accountName?.trim() || "";
      const _elem = loggedInLink || loggedOutLink?.parentElement || accountLink;
      const containerRef = _elem?.querySelector(".userDropdown") as HTMLUListElement;
      const loggedInUsername = await getUsername();
      const isLoggedInUser = loggedInUsername?.toUpperCase() === _username?.toUpperCase();

      if (!containerRef && _elem) {
        _elem.appendChild(UserPopup.cachedEl!);
        const root = createRoot(UserPopup.cachedEl!);
        root.render(
          <StrictMode>
            <UserPopupApp
              username={_username}
              isLoggedInUser={isLoggedInUser}
              isUserBadge={!!(loggedInLink || loggedOutLink?.parentElement)}
              parentRoot={root}
            />
          </StrictMode>
        );
      }
    }
  },
};
