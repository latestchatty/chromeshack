import {
    filtersContains,
    addFilter,
    removeFilter,
    highlightGroupContains,
    addHighlightUser,
    removeHighlightUser,
    enabledContains,
    getMutableHighlights
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

    toggleDropdown(elem, hide?) {
        if (hide && elem) elem.classList.add("hidden");
        else if (elem && elem.classList.contains("hidden")) elem.classList.remove("hidden");
        else if (elem && !elem.classList.contains("hidden")) elem.classList.add("hidden");
    },

    toggleDropdowns(targetElem?) {
        const targetDD = targetElem ? targetElem.querySelector("ul.userDropdown") : null;
        let userDDs = [...document.querySelectorAll("ul.userDropdown")];
        userDDs = userDDs.filter(x => x !== targetDD);
        // toggle our targeted dropdown if it exists
        if (targetDD) UserPopup.toggleDropdown(targetDD);
        // hide all other dropdowns if clicking outside of their boundary
        for (let dd of userDDs) UserPopup.toggleDropdown(dd, true);
    },

    createListItem(text?, url?, className?, target?) {
        let a = document.createElement("a");
        a.href = "";
        if (url) a.href = url;
        if (target) a.target = target;
        if (text) a.appendChild(document.createTextNode(text));
        let li = document.createElement("li");
        if (className) li.className = className;
        // Prevent menu clicks from bubbling up
        a.addEventListener("click", e => {
            e.stopPropagation();
        });
        li.appendChild(a);
        return li;
    },

    async handleFilterUser(e, username) {
        e.preventDefault();
        e.stopPropagation();
        let filtersHas = await filtersContains(username);
        if (!filtersHas) await addFilter(username);
        else await removeFilter(username);
        UserPopup.toggleDropdowns();
    },

    async handleHighlightUser(e, groupName, username) {
        e.preventDefault();
        e.stopPropagation();
        let highlightsHas = await highlightGroupContains(groupName, username);
        if (!highlightsHas) await addHighlightUser(groupName, username);
        else await removeHighlightUser(groupName, username);
        UserPopup.toggleDropdowns();
    },

    createFilterListItem(text, className) {
        let item = document.createElement("div");
        if (text) item.appendChild(document.createTextNode(text));
        let li = document.createElement("li");
        if (className) li.className = className;
        li.appendChild(item);
        return li;
    },

    async createFilterListItems(target, username) {
        let ulUser = target;
        let container = document.createElement("div");
        container.id = "filter-list";
        let separator = document.createElement("li");
        separator.setAttribute("class", "userDropdown-separator");
        container.appendChild(separator);
        let isApplied = ulUser.querySelector("#filter-list");
        if (isApplied) isApplied.parentNode.removeChild(isApplied);
        if (ulUser) {
            if (await enabledContains("custom_user_filters")) {
                let filtersHas = await filtersContains(username);
                let filterCustomItem = UserPopup.createFilterListItem(
                    `${filtersHas ? "Remove from" : "Add to"} Custom Filters`,
                    "userDropDown-custom-filter"
                );
                filterCustomItem.addEventListener("click", e =>
                    UserPopup.handleFilterUser(e, username)
                );
                container.appendChild(filterCustomItem);
            }
            if (await enabledContains("highlight_users")) {
                let highlightGroups = await getMutableHighlights();
                for (let group of highlightGroups || []) {
                    let groupContainsUser = await highlightGroupContains(group.name, username);
                    let filterHighlightsItem = UserPopup.createFilterListItem(
                        `${groupContainsUser ? "Remove from" : "Add to"} Highlights Group: ${
                            group.name
                        }`,
                        "userDropdown-highlights"
                    );
                    filterHighlightsItem.addEventListener("click", e =>
                        UserPopup.handleHighlightUser(e, group.name, username)
                    );
                    container.appendChild(filterHighlightsItem);
                }
            }
            ulUser.appendChild(container);
        }
    },

    displayUserMenu(parentObj, username, friendlyName) {
        // Create the dropdown menu if it doesn't already exist
        let ulUserDD = parentObj.querySelector("ul.userDropdown");
        if (!ulUserDD) {
            // Create UL that will house the dropdown menu
            var ulUser = document.createElement("ul");
            ulUser.className = "userDropdown";
            // Scrub username
            let usernameTxt = encodeURIComponent(username);
            if (friendlyName == "You") {
                var your = "Your";
                var vanitySearch = "Vanity Search";
                var parentAuthor = "Parent Author Search";
                // Add the account link to the dropdown menu
                ulUser.appendChild(
                    UserPopup.createListItem(
                        "Shack Account",
                        "/settings",
                        "userDropdown-lol userDropdown-separator"
                    )
                );
            } else {
                your = friendlyName + "'s";
                vanitySearch = 'Search for "' + friendlyName + '"';
                parentAuthor = friendlyName + ": Parent Author Search";
            }

            // Create menu items and add them to ulUser
            let postsUrl = "https://www.shacknews.com/user/" + usernameTxt + "/posts";
            ulUser.appendChild(UserPopup.createListItem(your + " Posts", postsUrl));

            let vanityUrl =
                "https://www.shacknews.com/search?chatty=1&type=4&chatty_term=" +
                usernameTxt +
                "&chatty_user=&chatty_author=&chatty_filter=all&result_sort=postdate_desc";
            ulUser.appendChild(UserPopup.createListItem(vanitySearch, vanityUrl));

            let repliesUrl =
                "https://www.shacknews.com/search?chatty=1&type=4&chatty_term=&chatty_user=&chatty_author=" +
                usernameTxt +
                "&chatty_filter=all&result_sort=postdate_desc";
            ulUser.appendChild(
                UserPopup.createListItem(parentAuthor, repliesUrl, "userDropdown-separator")
            );
            const wasWere = friendlyName === "You" ? "Were" : "Was";
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : Stuff " + friendlyName + " Wrote",
                    "https://www.shacknews.com/tags-user?user=" + usernameTxt + "#authored_by_tab",
                    "userDropdown-lol"
                )
            );
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : Stuff " + friendlyName + " Tagged",
                    "https://www.shacknews.com/tags-user?user=" + usernameTxt + "#lold_by_tab",
                    "userDropdown-lol"
                )
            );
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : " + your + " Fan Train",
                    "https://www.shacknews.com/tags-user?user=" + usernameTxt + "#fan_club_tab",
                    "userDropdown-lol"
                )
            );
            ulUser.appendChild(
                UserPopup.createListItem(
                    "[lol] : " + wasWere + " " + friendlyName + " Ever Funny?",
                    "https://www.shacknews.com/tags-ever-funny?user=" + usernameTxt,
                    "userDropdown-lol"
                )
            );
            // Add ulUser to the page
            parentObj.appendChild(ulUser);
        }
    },

    install() {
        // Add catch-all event handlers for creating user dropdown menus
        document.addEventListener("click", async e => {
            // try to eat exceptions that are typically harmless
            try {
                let this_elem = <HTMLElement>e.target;
                let this_parent = <HTMLElement>this_elem.parentNode;
                let sanitizedUser =
                    this_parent.matches("span.user") &&
                    superTrim(this_elem.innerText.split(" - ")[0]);
                // Post author clicked
                if (this_parent.matches("span.user:not(.this-user)") && this_elem.matches("a")) {
                    e.preventDefault();
                    e.stopPropagation();
                    UserPopup.toggleDropdowns(e.target);
                    UserPopup.displayUserMenu(e.target, sanitizedUser, sanitizedUser);
                    // add filter options for fullpost usernames
                    let usertext = this_elem.closest("span.user");
                    let ulUserDD = usertext && usertext.querySelector("ul.userDropdown");
                    await UserPopup.createFilterListItems(ulUserDD, sanitizedUser);
                } else if (this_parent.matches("span.user.this-user") && this_elem.matches("a")) {
                    // OWN user name clicked as post author
                    e.preventDefault();
                    e.stopPropagation();
                    UserPopup.toggleDropdowns(this_elem);
                    if (!this_elem.querySelector("ul.userDropdown"))
                        UserPopup.displayUserMenu(e.target, sanitizedUser, "You");
                } else if (this_elem.matches("a#userDropdownTrigger")) {
                    // User name clicked (at the top of the banner?)
                    e.preventDefault();
                    e.stopPropagation();
                    UserPopup.toggleDropdowns(e.target);
                    if (!this_elem.querySelector("ul.userDropdown"))
                        UserPopup.displayUserMenu(this_elem, UserPopup.getShackUsername(), "You");
                } else if (
                    !this_elem.closest("ul.userDropdown") ||
                    !this_elem.matches("a#userDropdownTrigger")
                ) {
                    UserPopup.toggleDropdowns();
                }
            } catch (e) {
                console.log(e);
            }
        });

        if (UserPopup.getShackUsername()) {
            // Add custom dropdown stuff to the Account button
            let $account = document.querySelector(
                "header .header-bottom .tools ul li a[href='/settings']"
            );
            $account.setAttribute("id", "userDropdownTrigger");
        }
    }
};

export default UserPopup;
