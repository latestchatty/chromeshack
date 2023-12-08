import React from "react";
import { createRoot } from "react-dom/client";
import { elemMatches, parseToElement } from "../../core/common/dom";
import { userPopupEvent } from "../../core/events";
import { getUsername } from "../../core/notifications";
import "../../styles/userpopup.css";
import { UserPopupApp } from "./UserPopupApp";

export const UserPopup = {
	cachedEl: null as HTMLElement,

	install() {
		document.addEventListener("click", UserPopup.clickHandler);
		userPopupEvent.addHandler(UserPopup.userPopupEventHandler);
		UserPopup.cacheInjectables();
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
		const userLink = isLoggedIn
			? elemMatches(_this, "span.user > a")
			: elemMatches(_this, "span.user");
		const accountLink =
			_this &&
			elemMatches(
				_this,
				"header .header-bottom .tools ul li a[href='/settings']",
			);
		const accountName = accountLink
			? (
					accountLink?.parentNode?.parentNode?.querySelector(
						"#user_posts",
					) as HTMLLIElement
			  )?.textContent
			: "";
		accountLink?.setAttribute("id", "userDropdownTrigger");

		if (userLink || accountLink) {
			e.preventDefault();
			const _username = userLink?.textContent.trim() || accountName.trim();
			const _elem = userLink || accountLink;
			const containerRef = _elem?.querySelector(
				".userDropdown",
			) as HTMLUListElement;
			const loggedInUsername = await getUsername();
			const isLoggedInUser =
				loggedInUsername?.toUpperCase() === _username?.toUpperCase();

			if (!containerRef && _elem) {
				_elem.appendChild(UserPopup.cachedEl);
				const root = createRoot(UserPopup.cachedEl!);
				root.render(
					<UserPopupApp
						username={_username}
						isLoggedInUser={isLoggedInUser}
						isUserBadge={!!userLink}
						parentRoot={root}
					/>,
				);
			}
		}
	},
};
