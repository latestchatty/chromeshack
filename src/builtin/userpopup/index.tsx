import React from "react";
import { render } from "react-dom";
import { elemMatches } from "../../core/common";
import { getUsername } from "../../core/notifications";
import { UserPopupApp } from "./UserPopupApp";

export const UserPopup = {
    async clickHandler(e: MouseEvent) {
        const _this = e?.target as HTMLElement;
        const userLink = _this && elemMatches(_this, "span.user > a");
        const accountLink = _this && elemMatches(_this, "header .header-bottom .tools ul li a[href='/settings']");
        const accountName = accountLink
            ? (accountLink?.parentNode?.parentNode?.querySelector("#user_posts") as HTMLLIElement)?.innerText
            : "";
        accountLink?.setAttribute("id", "userDropdownTrigger");

        if (userLink || accountLink) {
            e.preventDefault();
            e.stopPropagation();

            const _username = userLink?.innerText || accountName;
            const _elem = userLink || accountLink;
            const containerRef = _elem?.querySelector(".userDropdown") as HTMLUListElement;
            const loggedInUsername = await getUsername();
            const isLoggedInUser = loggedInUsername?.toUpperCase() === _username?.toUpperCase();

            if (!containerRef && _elem) {
                const appContainer = document.createElement("div");
                appContainer.setAttribute("class", "userDropdown");
                render(
                    <UserPopupApp username={_username} isLoggedInUser={isLoggedInUser} isUserBadge={!!userLink} />,
                    appContainer,
                );
                _elem.appendChild(appContainer);
            }
        }
    },

    install() {
        document.addEventListener("click", UserPopup.clickHandler);
    },
};
