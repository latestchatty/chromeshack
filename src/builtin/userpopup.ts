import {
    filtersContains,
    addFilter,
    removeFilter,
    highlightGroupContains,
    addHighlightUser,
    removeHighlightUser,
    enabledContains,
    getMutableHighlights,
} from "../core/settings";
import { superTrim } from "../core/common";

/*
    Shack: User Popup
    (ↄ)2011 Thom Wetzel

    This is the user menu stuff stripped out of the [lol] Greasemonkey script

    2011-04-26
        * First stab at profiles
*/

const UserPopup = {
    getShackUsername() {
        const username = document.getElementById("user_posts");
        return (username && username.innerText) || "";
    },

    toggleDropdown(elem: HTMLElement, hide?: boolean) {
        if (hide && elem) elem.classList.add("hidden");
        else if (elem && elem.classList.contains("hidden")) elem.classList.remove("hidden");
        else if (elem && !elem.classList.contains("hidden")) elem.classList.add("hidden");
    },

    toggleDropdowns(targetElem?: HTMLElement) {
        const targetDD = (targetElem ? targetElem.querySelector("ul.userDropdown") : null) as HTMLElement;
        let userDDs = [...document.querySelectorAll("ul.userDropdown")];
        userDDs = userDDs.filter((x) => x !== targetDD);
        // toggle our targeted dropdown if it exists
        if (targetDD) UserPopup.toggleDropdown(targetDD);
        // hide all other dropdowns if clicking outside of their boundary
        for (const dd of userDDs) UserPopup.toggleDropdown(dd as HTMLElement, true);
    },

    createListItem(text?: string, url?: string, className?: string, target?: string) {
        const a = document.createElement("a");
        a.href = "";
        if (url) a.href = url;
        if (target) a.target = target;
        if (text) a.appendChild(document.createTextNode(text));
        const li = document.createElement("li");
        if (className) li.className = className;
        // Prevent menu clicks from bubbling up
        a.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        li.appendChild(a);
        return li;
    },

    async handleFilterUser(e: MouseEvent, username: string) {
        e.preventDefault();
        e.stopPropagation();
        const filtersHas = await filtersContains(username);
        if (!filtersHas) await addFilter(username);
        else await removeFilter(username);
        UserPopup.toggleDropdowns();
    },

    async handleHighlightUser(e: MouseEvent, groupName: string, username: string) {
        e.preventDefault();
        e.stopPropagation();
        const highlightsHas = await highlightGroupContains(groupName, username);
        if (!highlightsHas) await addHighlightUser(groupName, username);
        else await removeHighlightUser(groupName, username);
        UserPopup.toggleDropdowns();
    },

    createFilterListItem(text: string, className: string) {
        const item = document.createElement("div");
        if (text) item.appendChild(document.createTextNode(text));
        const li = document.createElement("li");
        if (className) li.className = className;
        li.appendChild(item);
        return li;
    },

    async createFilterListItems(target: HTMLElement, username: string) {
        const ulUser = target;
        const container = document.createElement("div");
        container.id = "filter-list";
        const separator = document.createElement("li");
        separator.setAttribute("class", "userDropdown-separator");
        container.appendChild(separator);
        const isApplied = ulUser.querySelector("#filter-list");
        if (isApplied) isApplied.parentNode.removeChild(isApplied);
        if (ulUser) {
            if (await enabledContains("custom_user_filters")) {
                const filtersHas = await filtersContains(username);
                const filterCustomItem = UserPopup.createFilterListItem(
                    `${filtersHas ? "Remove from" : "Add to"} Custom Filters`,
                    "userDropDown-custom-filter",
                );
                filterCustomItem.addEventListener("click", (e: MouseEvent) => UserPopup.handleFilterUser(e, username));
                container.appendChild(filterCustomItem);
            }
            if (await enabledContains("highlight_users")) {
                const highlightGroups = await getMutableHighlights();
                for (const group of highlightGroups || []) {
                    const groupContainsUser = await highlightGroupContains(group.name, username);
                    const filterHighlightsItem = UserPopup.createFilterListItem(
                        `${groupContainsUser ? "Remove from" : "Add to"} Highlights Group: ${group.name}`,
                        "userDropdown-highlights",
                    );
                    filterHighlightsItem.addEventListener("click", (e) =>
                        UserPopup.handleHighlightUser(e, group.name, username),
                    );
                    container.appendChild(filterHighlightsItem);
                }
            }
            ulUser.appendChild(container);
        }
    },

    displayUserMenu(parentElem: HTMLElement, username: string, friendlyName: string) {
        // Create the dropdown menu if it doesn't already exist
        const ulUserDD = parentElem.querySelector("ul.userDropdown");
        if (!ulUserDD) {
            // Create UL that will house the dropdown menu
            const ulUser = document.createElement("ul");
            ulUser.className = "userDropdown";
            // Scrub username
            const usernameTxt = encodeURIComponent(username);
            let your = "Your";
            let vanitySearch = "Vanity Search";
            let parentAuthor = "Parent Author Search";
            if (friendlyName == "You") {
                // Add the account link to the dropdown menu
                ulUser.appendChild(
                    UserPopup.createListItem("Shack Account", "/settings", "userDropdown-lol userDropdown-separator"),
                );
            } else {
                your = friendlyName + "'s";
                vanitySearch = 'Search for "' + friendlyName + '"';
                parentAuthor = friendlyName + ": Parent Author Search";
            }

            // Create menu items and add them to ulUser
            const postsUrl = "https://www.shacknews.com/user/" + usernameTxt + "/posts";
            ulUser.appendChild(UserPopup.createListItem(your + " Posts", postsUrl));

            const vanityUrl =
                "https://www.shacknews.com/search?chatty=1&type=4&chatty_term=" +
                usernameTxt +
                "&chatty_user=&chatty_author=&chatty_filter=all&result_sort=postdate_desc";
            ulUser.appendChild(UserPopup.createListItem(vanitySearch, vanityUrl));

            const repliesUrl =
                "https://www.shacknews.com/search?chatty=1&type=4&chatty_term=&chatty_user=&chatty_author=" +
                usernameTxt +
                "&chatty_filter=all&result_sort=postdate_desc";
            ulUser.appendChild(UserPopup.createListItem(parentAuthor, repliesUrl, "userDropdown-separator"));
            const wasWere = friendlyName === "You" ? "Were" : "Was";
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : Stuff " + friendlyName + " Wrote",
                    "https://www.shacknews.com/tags-user?user=" + usernameTxt + "#authored_by_tab",
                    "userDropdown-lol",
                ),
            );
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : Stuff " + friendlyName + " Tagged",
                    "https://www.shacknews.com/tags-user?user=" + usernameTxt + "#lold_by_tab",
                    "userDropdown-lol",
                ),
            );
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : " + your + " Fan Train",
                    "https://www.shacknews.com/tags-user?user=" + usernameTxt + "#fan_club_tab",
                    "userDropdown-lol",
                ),
            );
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : " + wasWere + " " + friendlyName + " Ever Funny?",
                    "https://www.shacknews.com/tags-ever-funny?user=" + usernameTxt,
                    "userDropdown-lol",
                ),
            );
            // Add ulUser to the page
            parentElem?.appendChild(ulUser);
        }
    },

    install() {
        // Add catch-all event handlers for creating user dropdown menus
        document.addEventListener("click", async (e: MouseEvent) => {
            // try to eat exceptions that are typically harmless
            try {
                const this_elem = <HTMLElement>e.target;
                const this_parent = <HTMLElement>this_elem.parentNode;
                const sanitizedUser =
                    this_parent?.matches("span.user") && superTrim(this_elem.innerText.split(" - ")[0]);
                // Post author clicked
                if (this_parent.matches("span.user:not(.this-user)") && this_elem.matches("a")) {
                    e.preventDefault();
                    e.stopPropagation();
                    UserPopup.toggleDropdowns(this_elem);
                    UserPopup.displayUserMenu(this_elem, sanitizedUser, sanitizedUser);
                    // add filter options for fullpost usernames
                    const usertext = this_elem.closest("span.user");
                    const ulUserDD = usertext && (usertext.querySelector("ul.userDropdown") as HTMLElement);
                    await UserPopup.createFilterListItems(ulUserDD, sanitizedUser);
                } else if (this_parent.matches("span.user.this-user") && this_elem.matches("a")) {
                    // OWN user name clicked as post author
                    e.preventDefault();
                    e.stopPropagation();
                    UserPopup.toggleDropdowns(this_elem);
                    if (!this_elem.querySelector("ul.userDropdown")) {
                        UserPopup.displayUserMenu(this_elem, sanitizedUser, "You");
                    }
                } else if (this_elem.matches("a#userDropdownTrigger")) {
                    // User name clicked (at the top of the banner?)
                    e.preventDefault();
                    e.stopPropagation();
                    UserPopup.toggleDropdowns(this_elem);
                    if (!this_elem.querySelector("ul.userDropdown")) {
                        UserPopup.displayUserMenu(this_elem, UserPopup.getShackUsername(), "You");
                    }
                } else if (!this_elem.closest("ul.userDropdown") || !this_elem.matches("a#userDropdownTrigger")) {
                    UserPopup.toggleDropdowns();
                }
            } catch (e) {
                console.error(e);
            }
        });

        if (UserPopup.getShackUsername()) {
            // Add custom dropdown stuff to the Account button
            const $account = document.querySelector("header .header-bottom .tools ul li a[href='/settings']");
            $account.setAttribute("id", "userDropdownTrigger");
        }
    },
};

export default UserPopup;
