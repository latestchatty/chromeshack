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

    function jumpToNewPost() {
        var pendings = document.getElementsByClassName('refresh_pending');
        if (pendings.length == 0) {
            return;
        }
        var pending = pendings[0];
        var divRefresh = pending.parentNode;
        var divFullpost = divRefresh.parentNode;
        var li = divFullpost.parentNode;
        if (!startsWith(li.id, 'item_')) {
            return;
        }
        $('html, body').animate({
            scrollTop: ($(li).offset().top - 50) + 'px'
        }, 'fast');
    }

    function installJumpToNewPostButton() {
        var body = document.getElementsByTagName('body')[0];
        var a = document.createElement('a');
        a.id = 'jump_to_new_post';
        a.innerHTML = '<span>&#9733;</span>';
        a.style.display = 'none';
        a.addEventListener('click', jumpToNewPost);
        body.appendChild(a);
    }

    function showOrHideJumpToNewPostButton() {
        var pending = document.getElementsByClassName('refresh_pending');
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

        GM_addStyle(''
            + 'a#jump_to_new_post { border: 1px solid navyblue; background: skyblue; color: black; position: fixed; '
            + '    width: 70px; height: 70px; left: -45px; top: 20px; border-radius: 20px; z-index: 9999; }'
            + 'a#jump_to_new_post:hover { color: white; }'
            + 'a#jump_to_new_post span { position: fixed; left: -3px; top: 42px; font-size: 35px; }'
            + 'a.refresh_pending { background: skyblue; border-radius: 10px; width: 15px !important; }'
            + 'div#commenttools.commentstools .newcomment { width: 50%; }'
            + 'div#commenttools.commentstools .pagenavigation { position: absolute; right: 0px; width: 60%; '
            + '    text-align: left }'
        );

        installJumpToNewPostButton();

        // Recalculate the "jump to new post" button's visibility when the user refreshes a thread.
        document.getElementById('dom_iframe').addEventListener('load', function() {
            // This is fired BEFORE the onload inside the Ajax response, so we need to wait until
            // the inner onload has run.
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
