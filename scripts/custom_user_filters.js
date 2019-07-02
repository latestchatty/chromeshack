(function() {
    function has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    function startsWith(haystack, needle) {
        return haystack.indexOf(needle) == 0;
    }

    function getUserId(username) {
        // Look for a post on this page from this username.
        var classPrefix = 'olauthor_';
        username = superTrim(username).toLowerCase();
        var userSpans = document.querySelectorAll('span.oneline_user');
        for (var i = 0; i < userSpans.length; i++) {
            var spanText = superTrim(userSpans[i].innerHTML).toLowerCase();
            if (username == spanText) {
                var parentDiv = userSpans[i].parentNode;
                if (parentDiv.tagName !== 'DIV') {
                    continue; // Sanity check
                }
                var classNames = parentDiv.className.split(/\s+/);
                for (var j = 0; j < classNames.length; j++) {
                    var className = classNames[j];

                    if (startsWith(className, classPrefix)) {
                        return parseInt(className.substring(classPrefix.length));
                    }
                }
            }
        }
        return -1;
    }

    function removePostsFromUserId(id) {
        var postDivs = document.querySelectorAll('div.olauthor_' + id);
        for (var i = 0; i < postDivs.length; i++) {
            var postDiv = postDivs[i];
            var postLi = postDiv.parentNode;
            if (postLi.tagName === 'LI') {
                postLi.parentNode.removeChild(postLi);
            }
        }
    }

    function applyFilter() {
        var filteredUsernames = getSetting('user_filters');
        if (!Array.isArray(filteredUsernames)) {
            // No username filters; do not bother.
            return;
        }
        // The CSS class for a user's posts includes an ID, so we need to map from usernames to IDs.
        // We'll save this map into a setting so we only have to do this once per username added to the filter list.
        var usernameIdMap = {};
        // Make sure each filtered username has a corresponding id in usernameIdMap.  Then hide posts from that user
        // by setting the CSS for their posts.
        for (var i = 0; i < filteredUsernames.length; i++) {
            var username = filteredUsernames[i];
            if (!has(usernameIdMap, username)) {
                var id = getUserId(username);
                if (id >= 0) {
                    usernameIdMap[username] = id;
                }
            }
            if (has(usernameIdMap, username)) {
                removePostsFromUserId(usernameIdMap[username]);
            }
        }
    }

    function install() {
        // Re-filter when a thread is updated by the "refresh" button.
        document.getElementById('dom_iframe').addEventListener('load', function() {
            // This is fired BEFORE the onload inside the Ajax response, so we need to wait until
            // the inner onload has run.
            setTimeout(applyFilter, 0);
        });
        applyFilter();
    }

    settingsLoadedEvent.addHandler(function() {
        if (objContains("custom_user_filters", getSetting("enabled_scripts"))) {
            install();
        }
    });
})();
