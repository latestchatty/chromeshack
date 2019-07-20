/*
    Shack: User Popup
    (ↄ)2011 Thom Wetzel

    This is the user menu stuff stripped out of the [lol] Greasemonkey script

    2011-04-26
        * First stab at profiles
*/
// grab start time of script
const getTime = () => {
    benchmarkTimer = new Date();
    return benchmarkTimer.getTime();
};
let benchmarkTimer = null;
let scriptStartTime = getTime();

const addCommas = nStr => {
    nStr += "";
    x = nStr.split(".");
    x1 = x[0];
    x2 = x.length > 1 ? "." + x[1] : "";
    let rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, "$1" + "," + "$2");
    }
    return x1 + x2;
};

const isLoggedIn = () => {
    return document.getElementById("user_posts") != null;
};

const getShackUsername = () => {
    return document.getElementById("user_posts").innerHTML;
};

const createListItem = (text, url, className, target) => {
    let a = document.createElement("a");
    a.href = url;
    if (typeof target != "undefined") {
        a.target = target;
    }
    a.appendChild(document.createTextNode(text));

    let li = document.createElement("li");
    if (typeof className != "undefined") {
        li.className = className;
    }

    // Prevent menu clicks from bubbling up
    a.addEventListener(
        "click",
        e => {
            e.stopPropagation();
        },
        false
    );

    li.appendChild(a);

    return li;
};

const displayUserMenu = (parentObj, username, friendlyName) => {
    // Create the dropdown menu if it doesn't already exist
    ulUserDD = parentObj.querySelector("ul.userDropdown");
    if (ulUserDD == null) {
        // Create UL that will house the dropdown menu
        let ulUser = document.createElement("ul");
        ulUser.className = "userDropdown";

        // Scrub username
        username = encodeURIComponent(String(stripHtml(username).trim()));

        if (friendlyName == "You") {
            your = "Your";
            vanitySearch = "Vanity Search";
            parentAuthor = "Parent Author Search";

            // Add the account link to the dropdown menu
            ulUser.appendChild(
                createListItem("Shack Account", "/settings", "userDropdown-lol userDropdown-separator")
            );
        } else {
            your = friendlyName + "'s";
            vanitySearch = 'Search for "' + friendlyName + '"';
            parentAuthor = friendlyName + ": Parent Author Search";
        }

        // Create menu items and add them to ulUser
        let postsUrl = "https://www.shacknews.com/user/" + username + "/posts";
        ulUser.appendChild(createListItem(your + " Posts", postsUrl));

        let vanityUrl =
            "https://www.shacknews.com/search?chatty=1&type=4&chatty_term=" +
            username +
            "&chatty_user=&chatty_author=&chatty_filter=all&result_sort=postdate_desc";
        ulUser.appendChild(createListItem(vanitySearch, vanityUrl));

        let repliesUrl =
            "https://www.shacknews.com/search?chatty=1&type=4&chatty_term=&chatty_user=&chatty_author=" +
            username +
            "&chatty_filter=all&result_sort=postdate_desc";
        ulUser.appendChild(createListItem(parentAuthor, repliesUrl, "userDropdown-separator"));

        const wasWere = friendlyName === "You" ? "Were" : "Was";
        ulUser.appendChild(
            createListItem(
                "[lol] : Stuff " + friendlyName + " Wrote",
                "https://www.shacknews.com/tags-user?user=" + username + "#authored_by_tab",
                "userDropdown-lol"
            )
        );
        ulUser.appendChild(
            createListItem(
                "[lol] : Stuff " + friendlyName + " Tagged",
                "https://www.shacknews.com/tags-user?user=" + username + "#lold_by_tab",
                "userDropdown-lol"
            )
        );
        ulUser.appendChild(
            createListItem(
                "[lol] : " + your + " Fan Train",
                "https://www.shacknews.com/tags-user?user=" + username + "#fan_club_tab",
                "userDropdown-lol"
            )
        );
        ulUser.appendChild(
            createListItem(
                "[lol] : " + wasWere + " " + friendlyName + " Ever Funny?",
                "https://www.shacknews.com/tags-ever-funny?user=" + username,
                "userDropdown-lol"
            )
        );

        // Add ulUser to the page
        parentObj.appendChild(ulUser);
    } // ulUserDD already exists -- this just handles the toggling of its display
    else {
        // Toggle ulUser's classname
        if (ulUserDD.className.split(" ").indexOf("hidden") == -1)
            ulUserDD.classList.add("hidden");
        else
            ulUserDD.classList.remove("hidden");
    }
};

// Add catch-all event handlers for creating user dropdown menus
document.addEventListener(
    "click",
    e => {
        // try to eat exceptions that are typically harmless
        try {
            let t = e.target;
            let p = t.parentNode;
            // use the nuShack username rather than the full switcher string (if applicable)
            let matchFilteredUser = t.tagName === "A" && /(.*?)\s\-\s\(/i.exec(t.innerHTML);
            let sanitizedUser = !!matchFilteredUser ? matchFilteredUser[1] : t.innerHTML;

            // Post author clicked
            if (t.tagName == "A" && p.tagName == "SPAN" && p.className == "user") {
                e.preventDefault();
                e.stopPropagation();

                displayUserMenu(t, sanitizedUser, sanitizedUser);
            } else if (t.id == "userDropdownTrigger") {
                // User name clicked (at the top of the banner?)
                e.preventDefault();
                e.stopPropagation();

                displayUserMenu(t, getShackUsername(), "You");
            }

            // OWN user name clicked as post author
            else if (t.tagName == "A" && p.tagName == "SPAN" && p.className == "user this-user") {
                e.preventDefault();
                e.stopPropagation();
                displayUserMenu(t, sanitizedUser, "You");
            }
        } catch (e) {
            console.log(e);
        }
    },
    false
);

if (isLoggedIn()) {
    // Add custom dropdown stuff to the Account button
    let $account = document.querySelector("header .header-bottom .tools ul li a[href='/settings']");
    $account.setAttribute("id", "userDropdownTrigger");
}

addDeferredHandler(settingsContain("use_winchatty_search"), res => {
    if (res) {
        $(".tog-search")
            .prop("href", "https://winchatty.com")
            .prop("target", "_blank");
        $(".modal.search").remove();
    }
});
