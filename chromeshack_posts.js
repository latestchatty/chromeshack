ChromeShack =
{
    install: function()
    {
        // use some cached debounce helpers to prevent odd event behavior when bubbling
        var debounced = debounce(function(cb, node) { cb(node); }, 500);
        var debouncedScroll = debounce(function(cb, node, arg) {
            if (arg) { cb(node, arg); }
            else { cb(node); }
            if (getSetting("enabled_scripts").contains("scroll_to_post")) {
                const smooth = getSetting('scroll_to_post_smooth', true);
                scrollToElement(node, smooth ? 200 : 0);
            }
        }, 100);

        // use MutationObserver instead of Mutation Events for a massive performance boost
        var observer = new MutationObserver(function(mutationsList) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type == "childList") {
                    mutation.addedNodes.forEach(function (node) {
                        // wrap in a try/catch in case our element node is null
                        try {
                            var elem = node.parentNode;
                            var source_id = elem.id;

                            // starts with "root", they probably refreshed the thread
                            if (node.classList != null && node.classList.contains("root")) {
                                // don't scroll - can't tell between fullpost and rootpost!
                                debounced(ChromeShack.processFullPosts, elem);
                            }

                            // starts with "item_", they probably clicked on a reply
                            if (source_id.indexOf("item_") == 0)
                            {
                                // grab the id from the old node, since the new node doesn't contain the id
                                var id = source_id.substr(5);
                                debouncedScroll(ChromeShack.processPost, elem, id);
                            }
                        }
                        catch (e) {}
                    })

                    mutation.addedNodes.forEach(function (changedNode) {
                        try {
                            var changed_id = changedNode.id;

                            // check specifically for the postbox being added
                            if (changed_id == "postbox")
                            {
                                debouncedScroll(ChromeShack.processPostBox, changedNode);
                            }
                        }
                        catch (e) {}
                    })
                }
            })
        });
        observer.observe(document, { characterData: true, subtree: true, childList: true });
    },

    processFullPosts: function(element)
    {
        // process fullposts
        var items = document.evaluate(".//div[contains(@class, 'fullpost')]/..", element, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        for (item = null, i = 0; item = items.snapshotItem(i); i++)
        {
            ChromeShack.processPost(item, item.id.substr(5));
        }
        ChromeShack.processPostStyle(element);
        fullPostsCompletedEvent.raise();
    },

    processPost: function(item, root_id)
    {
        var ul = item.parentNode;
        var div = ul.parentNode;
        var is_root_post = (div.className.indexOf("root") >= 0);
        ChromeShack.processPostStyle(item);
        processPostEvent.raise(item, root_id, is_root_post);
    },

    processPostBox: function(postbox)
    {
        processPostBoxEvent.raise(postbox);
    },

    processPostStyle: function(elem)
    {
        // avoid applying banners if not enabled
        if (document.querySelector(".show_banners") != null) {
            // cross-browser support for ChromeShack post banners via style injection
            var _isOfftopic = elem.getElementsByClassName("fpmod_offtopic").length > 0;
            var _isStupid = elem.getElementsByClassName("fpmod_stupid").length > 0;
            var _isPolitical = elem.getElementsByClassName("fpmod_political").length > 0;
            var _isInformative = elem.getElementsByClassName("fpmod_informative").length > 0;
            var _url;

            // rely on polyfills for relative extension paths
            if (_isOfftopic) {
                _url = `url("${browser.runtime.getURL("images/banners/offtopic.png")}")`;
                elem.getElementsByClassName("fpmod_offtopic")[0].style.backgroundImage = _url;
            } else if (_isPolitical) {
                _url = `url("${browser.runtime.getURL("images/banners/political.png")}")`;
                elem.getElementsByClassName("fpmod_political")[0].style.backgroundImage = _url;
            } else if (_isStupid) {
                _url = `url("${browser.runtime.getURL("images/banners/stupid.png")}")`;
                elem.getElementsByClassName("fpmod_stupid")[0].style.backgroundImage = _url;
            } else if (_isInformative) {
                _url = `url("${browser.runtime.getURL("images/banners/interesting.png")}")`;
                elem.getElementsByClassName("fpmod_informative")[0].style.backgroundImage = _url;
            }
        }
    }
}

settingsLoadedEvent.addHandler(function() {
    ChromeShack.install();
    ChromeShack.processFullPosts(document);
});
