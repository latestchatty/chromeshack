(function() {
    var g_lastEventId = 0;

    function startsWith(haystack, needle) {
        return haystack.indexOf(needle) == 0;
    }

    function processEvents(events) {
        for (var i = 0; i < events.length; i++) {
            var evt = events[i];
            if (evt.eventType !== 'newPost')
                continue;

            var postId = parseInt(evt.eventData.postId);
            if (document.getElementById(`item_${postId}`) !== null)
                continue; // Received an event for a post we already have.

            var threadId = parseInt(evt.eventData.post.threadId);
            var a = document.querySelector(`li#item_${threadId} div.fullpost div.refresh a`);
            if (a !== null)
                a.classList.add("refresh_pending");
        }
        showOrHideJumpToNewPostButton();

        // if the Thread Pane script is loaded, then refresh the thread pane
        if (typeof refreshThreadPane !== 'undefined') {
            refreshThreadPane();
        }
    }

    function loop() {
        try {
            fetchSafe(`https://winchatty.com/v2/waitForEvent?lastEventId=${g_lastEventId}`)
            .then(json => {
                // sanitized in common.js!
                if (json) {
                    g_lastEventId = parseInt(json.lastEventId);
                    processEvents(json.events);
                }
                // Short delay in between loop iterations.
                setTimeout(loop, 5000);
            });
        } catch (e) { };
    }

    function isCollapsed(aRefresh) {
        var divRefresh = aRefresh.parentNode;
        if (divRefresh === null) {
            return false;
        }
        var divFullpost = divRefresh.parentNode;
        if (divFullpost === null) {
            return false;
        }
        var li = divFullpost.parentNode;
        if (li === null) {
            return false;
        }
        var ul = li.parentNode;
        if (ul === null) {
            return false;
        }
        var root = ul.parentNode;
        return root !== null && root.tagName == 'DIV' && root.className.split(' ').indexOf('collapsed') !== -1;
    }

    function getNonCollapsedPendings() {
        var pendings = document.getElementsByClassName('refresh_pending');
        var filtered = [];

        for (var i = 0; i < pendings.length; i++) {
            if (!isCollapsed(pendings[i])) {
                filtered.push(pendings[i]);
            }
        }

        return filtered;
    }

    function jumpToNewPost(e) {
        e.preventDefault();
        var aRefreshes = getNonCollapsedPendings();
        if (aRefreshes.length > 0) {
            var scroll = $(window).scrollTop();
            var divFirstFullPost = aRefreshes[0].parentNode.parentNode.parentNode;

            for (var i = 0; i < aRefreshes.length; i++) {
                var aRefresh = aRefreshes[i];
                var divPostItem = aRefresh.parentNode.parentNode.parentNode;
                var offset = $(divPostItem).offset().top;

                // if the element would be elsewhere on the page - scroll to it
                if (!elementIsVisible(divPostItem, true) && offset > scroll) {
                    scrollToElement(divPostItem);
                    return;
                }
            }

            // default to the first pending post
            scrollToElement(divFirstFullPost);
        }
    }

    function installJumpToNewPostButton() {
        var position = document.querySelector(".header-bottom .logo.alt");
        var starContainer = document.createElement("div");
        var star = document.createElement('a');
        starContainer.setAttribute("id", "post_highlighter_container");
        starContainer.classList.add("hidden");
        star.setAttribute("id" ,"jump_to_new_post");
        star.addEventListener('click', jumpToNewPost);

        starContainer.appendChild(star);
        position.appendChild(starContainer);
        // position.parentNode.insertBefore(starContainer, position);
    }

    function showOrHideJumpToNewPostButton() {
        var pending = getNonCollapsedPendings();
        var button = document.getElementById('post_highlighter_container');
        var indicator = '★ ';
        var titleHasIndicator = startsWith(document.title, indicator);

        if (pending.length > 0) {
            if (button !== null) {
                button.classList.remove("hidden");
            }
            if (!titleHasIndicator) {
                document.title = indicator + document.title;
            }

            $(document.getElementById('jump_to_new_post')).html(indicator + pending.length.toString());
        } else {
            if (button !== null) {
                button.classList.add("hidden");
            }
            if (titleHasIndicator) {
                document.title = document.title.substring(indicator.length);
            }
        }
    }

    function install() {
        // Only install on the main /chatty page, not an individual thread.
        if (document.getElementById('newcommentbutton') === null) {
            return;
        }

        // Only install on the first page of the chatty.
        var aSelectedPages = document.getElementsByClassName('selected_page');
        if (aSelectedPages.length === 0 || aSelectedPages[0].innerHTML !== '1') {
            return;
        }

        installJumpToNewPostButton();

        // Recalculate the "jump to new post" button's visibility when the user refreshes a thread.
        document.getElementById('dom_iframe').addEventListener('load', function() {
            // This is fired BEFORE the onload inside the Ajax response, so we need to wait until
            // the inner onload has run.
            setTimeout(showOrHideJumpToNewPostButton, 0);
        });

        // Trying to get a notification when the user collapses a post.  This is easy...
        document.addEventListener('click', function() {
            // Same trick as above; let's wait until other events have executed.
            setTimeout(showOrHideJumpToNewPostButton, 0);
        });

        // We need to get an initial event ID to start with.
        fetchSafe("https://winchatty.com/v2/getNewestEventId")
        .then(json => {
            // sanitized in common.js!
            g_lastEventId = parseInt(json.eventId);
            loop();
        });
    }

    settingsLoadedEvent.addHandler(function() {
        if (getSetting("enabled_scripts").contains("highlight_pending_new_posts")) {
            install();
        }
    });
})();
