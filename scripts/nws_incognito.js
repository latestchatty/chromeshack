settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("nws_incognito"))
    {
        NwsIncognito =
        {
            hookToNwsPosts: function(item)
            {
                var allLinks = [];
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
                        //Add href to collection for open all.
                        allLinks.push(cloned.href);
                        $(cloned).click(function(e) {
                            chrome.runtime.sendMessage({name: "launchIncognito", value: e.target.href});
                            return false;
                        });

                        cloned.innerHTML += ' (Incognito)';
                        $(links[iLink]).replaceWith(cloned);
                    }

                    //If we're allowed incognito access, we can open all links.  Otherwise it's a shitstorm since it will open a new window for each link.
                    chrome.runtime.sendMessage({name: 'allowedIncognitoAccess'}, function (allowed) {
                        if(allowed)
                        {
                            if(links.length > 1)
                            {
                                $(postBody).prepend($('<a>').attr('href', '#').html('Open All (Incognito)').click(function(){
                                    //Run the first link and use a callback on message completion to ensure the window is created and all subsequent calls will open in that window.
                                    chrome.runtime.sendMessage({name: "launchIncognito", value: allLinks[0]}, function (response) {
                                        if(allLinks.length <= 1) return;
                                        for(var i=1; i<allLinks.length; i++)
                                        {
                                            chrome.runtime.sendMessage({name: "launchIncognito", value: allLinks[i]});
                                        }
                                    });
                                return false;
                                }).append($('<br/><br/>')));
                            }
                        }
                    });
                }
            }
        }

        processPostEvent.addHandler(NwsIncognito.hookToNwsPosts);
    }
});