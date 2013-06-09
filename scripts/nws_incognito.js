settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("nws_incognito"))
    {
        NwsIncognito =
        {
            hookToNwsPosts: function(item)
            {
                var nwsPost = getDescendentByTagAndAnyClassName(item, 'div', 'fpmod_nws');
                if(nwsPost)
                {
                    var postBody = getDescendentByTagAndClassName(nwsPost, 'div', 'postbody');
                    var links = postBody.getElementsByTagName('a');
                    for(var iLink = 0; iLink < links.length; iLink++)
                    {
                        //Clone the link to get rid of any handlers that were put on it before (like the inline image loader)
                        //Of course, that relies on it being done before this.  So... yeah.
                        var cloned = links[iLink].cloneNode(true);
                        $(cloned).click(function(e) {
                            chrome.runtime.sendMessage({name: "launchIncognito", value: e.target.href});
                            return false;
                        });

                        cloned.innerHTML += ' (Incognito)';
                        postBody.replaceChild(cloned, links[iLink]);
                    }
                }
            }
        }

        processPostEvent.addHandler(NwsIncognito.hookToNwsPosts);
    }
});