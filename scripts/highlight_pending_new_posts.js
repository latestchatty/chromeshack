(function() {
    var g_lastEventId = 0;

    function has(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    function startsWith(haystack, needle) {
        return haystack.indexOf(needle) == 0;
    }

    function ajaxGet(url, doneFunc, failFunc) {
        $.ajax({
            type: "GET",
            url: url,
            cache: false,
            dataType: 'json',
        }).done(function(data, textStatus, jqXHR) {
            if (has(data, 'error')) {
                var message = data.code + ' - ' + data.message;
                console.log('Request failed: ' + url + ' - ' + message);
                failFunc(message);
            } else {
                doneFunc(data);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var message = '';
            if ($.type(textStatus) === 'string') {
                message += textStatus;
            } else {
                message += 'unknown error';
            }
            if ($.type(errorThrown) === 'string') {
                message += ' - ' + errorThrown;
            }
            console.log('Request failed: ' + url + ' - ' + message);
            failFunc(message);
        });
    }

    function processEvents(events) {
        for (var i = 0; i < events.length; i++) {
            var evt = events[i];
            if (evt.eventType !== 'newPost') {
                continue;
            }
            var postId = parseInt(evt.eventData.postId);
            if (document.getElementById('item_' + postId) !== null) {
                continue; // Received an event for a post we already have.
            }
            var threadId = parseInt(evt.eventData.post.threadId);
            var a = document.querySelector('li#item_' + threadId + ' div.fullpost div.refresh a');
            if (a !== null) {
                a.className = a.className + ' refresh_pending';
            }
        }
        showOrHideJumpToNewPostButton();
    }

    function loop() {
        ajaxGet(
            window.location.protocol + '//winchatty.com/v2/waitForEvent?lastEventId=' + g_lastEventId,
            function(data) {
                g_lastEventId = parseInt(data.lastEventId);
                processEvents(data.events);

                // Short delay in between loop iterations.
                setTimeout(loop, 2000);
            },
            function(error) {
                // This is a non-essential feature so we will simply stop looping if this fails.
            });
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

    function getPostOffset(aRefresh) {
        var divRefresh = aRefresh.parentNode;
        var divFullpost = divRefresh.parentNode;
        var li = divFullpost.parentNode;
        if (!startsWith(li.id, 'item_')) {
            return 0;
        }
        return $(li).offset().top - 50;
    }

    function jumpToNewPost() {
        var aRefreshes = getNonCollapsedPendings();
        if (aRefreshes.length > 1) {
            var scroll = $(window).scrollTop();
            for (var i = 0; i < aRefreshes.length; i++) {
                var aRefresh = aRefreshes[i];
                var offset = getPostOffset(aRefresh);
                if (offset > scroll) {
                    $('html, body').animate({ scrollTop: offset + 'px' }, 'fast');
                    return;
                }
            }
        }

        var firstOffset = getPostOffset(aRefreshes[0]);;
        $('html, body').animate({ scrollTop: firstOffset + 'px' }, 'fast');
    }

    function installJumpToNewPostButton() {
        var body = document.getElementsByTagName('body')[0];

        var star = document.createElement('a');
        star.id = 'jump_to_new_post';
        star.style.display = 'none';
        star.innerHTML = '1';
        star.addEventListener('click', jumpToNewPost);

        body.appendChild(star);
    }

    function showOrHideJumpToNewPostButton() {
        var pending = getNonCollapsedPendings();
        var button = document.getElementById('jump_to_new_post');
        var indicator = '★ ';
        var titleHasIndicator = startsWith(document.title, indicator);

        if (pending.length > 0) {
            if (button !== null) {
                button.style.display = 'inline-block';
            }
            if (!titleHasIndicator) {
                document.title = indicator + document.title;
            }

            document.getElementById('jump_to_new_post').innerHTML = indicator + pending.length.toString();
        } else {
            if (button !== null) {
                button.style.display = 'none';
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

        GM_addStyle(''
            // The button at the top of the page indicating new posts are available
            + 'a#jump_to_new_post { border: 1px solid #a19aaf; background: #908a9d; position: fixed; '
            + '    width: 50px; top: 0px; right: 0px; z-index: 9999; '
            + "    font-size: 18px; color: white; text-align: center; font-family: 'Shack Sans', sans-serif; "
            + '    -webkit-user-select: none; }'
            + 'a#jump_to_new_post:hover { background-color: #5c5070; border-color: #6f6088; }'
            + '@media (max-width: 1240px) {'
            + '    a#jump_to_new_post { left: 650px; }'
            + '}'
            + '@media (max-width: 1023px) {'
            + '    a#jump_to_new_post { left: 560px; top: 5px; }'
            + '}'
            + '@media (max-width: 767px) {'
            + '    a#jump_to_new_post { left: 10px; }'
            + '}'
            
            // The thread refresh button when highlighted
            + 'a.refresh_pending { background: skyblue; border-radius: 10px; width: 14px !important; '
            + '    height: 15px !important; }'
        );

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
        ajaxGet(
            window.location.protocol + '//winchatty.com/v2/getNewestEventId',
            function(data) {
                g_lastEventId = parseInt(data.eventId);
                loop();
            },
            function(error) {
                // This is a non-essential feature so we will simply disable the feature if this fails.                
            });
    }

    settingsLoadedEvent.addHandler(function() {
        if (getSetting("enabled_scripts").contains("highlight_pending_new_posts")) {
            install();
        }
    });
})();
