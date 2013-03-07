/**
*   Originally authored by indosaurus, re-written for chromeshack.
*/

settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("elder_scroll"))
    {       
        ElderScroll = 
        {
            pxToLoadNew: 500,
            isLoadingNew: false,
            divLoadingInfo: null,
            rootThreads: [],

            install: function()
            {
                if (ElderScroll.getDivNavigation() != 0)
                {
                    ElderScroll.updateRootThreads();
                    window.addEventListener('scroll', ElderScroll.reachedBottom, false);
                    window.addEventListener('resize', ElderScroll.reachedBottom, false);
                }
            },
            
            updateRootThreads: function()
            {
                var items = document.evaluate(".//div[contains(@class, 'fullpost')]/..", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
                for (item = null, i = 0; item = items.snapshotItem(i); i++)
                {
                    ElderScroll.rootThreads.push(item.id.substr(5));
                }
            },

            createDivMessage: function(text, addLoadingAnimation)
            {
                var divLoadingInfo = document.createElement('div');
                divLoadingInfo.id = 'elderscroll-message';
                divLoadingInfo.appendChild(document.createTextNode(text));
                                
                if (addLoadingAnimation)
                {
                    var shackLogo = document.createElement('div');
                    shackLogo.id = 'shackLogo';
                    divLoadingInfo.appendChild(shackLogo);
                }
                
                return divLoadingInfo;
            },
            
            getDivMessage: function(parentNode)
            {
                return document.getElementById('elderscroll-message');
            },

            getDivThreadContainer: function()
            {
                return document.getElementById('chatty_comments_wrap');
            },

            getDivThreads: function()
            {
                return getDescendentByTagAndClassName(ElderScroll.getDivThreadContainer(), 'div', 'threads');  
            },

            getDivNavigation: function()
            {
                return getDescendentsByTagAndClassName(ElderScroll.getDivThreadContainer(), 'div', 'pagenavigation');
            },

            reachedBottom: function()
            {
                if (!ElderScroll.isLoadingNew)
                {
                    var divThreads = ElderScroll.getDivThreads();

                    // top of div + its height
                    var divBottomPos = divThreads.offsetTop + divThreads.offsetHeight;
                    
                    // top of viewport + viewport height
                    var viewPortBottomPos = window.pageYOffset + window.innerHeight;

                    // 500 -> pixels at which we have left to load in new threads.
                    if ((divBottomPos - ElderScroll.pxToLoadNew) <= viewPortBottomPos)
                    {
                        if (ElderScroll.nextPageExists())
                        {
                            ElderScroll.loadNextPage();
                        } else {
                            divThreads.appendChild(ElderScroll.createDivMessage('No more threads to load.', false));
                            ElderScroll.isLoadingNew = true;
                        }
                    }
                }
            },

            getNextPage: function()
            {
                var divThreadContainer = ElderScroll.getDivThreadContainer();
                var currentPage = getDescendentByTagAndClassName(divThreadContainer, 'a', 'selected_page');

                return parseInt(currentPage.innerHTML) + 1;
            },

            nextPageExists: function()
            {
                var divNavigation = ElderScroll.getDivNavigation();
                var nextButton = divNavigation[0].lastChild;

                // <a> tag = more pages wooo!
                // <span> tag = no more *sad panda*
                return (nextButton.tagName.toLowerCase() == 'a')
            },

            loadNextPage: function(pageNum)
            {
                ElderScroll.isLoadingNew = true;

                var divThreads = ElderScroll.getDivThreads();
                divThreads.appendChild(ElderScroll.createDivMessage('Loading new posts...', true));
                
                var nextPageURL = "http://www.shacknews.com/chatty?page=" + ElderScroll.getNextPage();
              
                getUrl(nextPageURL, function(response)
                {
                    divThreads.removeChild(ElderScroll.getDivMessage());
                    
                    if (response.status == 200 && response.statusText.toLowerCase() == 'ok')
                    {
                        // a _bad_ way of doing this...
                        var divResponse = document.createElement('div');
                        divResponse.innerHTML = response.responseText;

                        var newDivThreadContainer = getDescendentByTagAndClassName(divResponse, 'div', 'commentsblock');
                        var newDivNavigation = getDescendentByTagAndClassName(newDivThreadContainer, 'div', 'pagenavigation');
                        var newDivThreads = getDescendentByTagAndClassName(newDivThreadContainer, 'div', 'threads');

                        var fragment = document.createDocumentFragment();
                        
                        /* To try to preserve the DOM of the original page,
                        we'll include text nodes even if they're just
                        linebreaks. Some other script might rely on those being
                        there. */
                        fragment.appendChild(newDivThreads.childNodes[0].cloneNode(true));

                        // Every 4th node is a new thread.
                        for (var i = 1; i < newDivThreads.childNodes.length; i = i + 4)
                        {
                            if (newDivThreads.childNodes[i].tagName == 'DIV' && ElderScroll.rootThreads.indexOf(newDivThreads.childNodes[i].id.substr(5)) == -1 ) {
                                ElderScroll.rootThreads.push(newDivThreads.childNodes[i].id.substr(5));
                                fragment.appendChild(newDivThreads.childNodes[i].cloneNode(true));      // <div id="root...
                                fragment.appendChild(newDivThreads.childNodes[i+1].cloneNode(true));    // text node
                                fragment.appendChild(newDivThreads.childNodes[i+2].cloneNode(true));    // <hr class="ielarynxhack">
                                fragment.appendChild(newDivThreads.childNodes[i+3].cloneNode(true));    // text node
                            } else {
                                if (newDivThreads.childNodes[i].tagName == 'DIV')
                                    console.log("ElderScroll: Skipping dupe thread " + newDivThreads.childNodes[i].id);
                            }
                        }

                        divThreads.appendChild(fragment.cloneNode(true));

                        // update pageNavigation divs
                        var divThreadContainer = ElderScroll.getDivThreadContainer();
                        var divNavigation = ElderScroll.getDivNavigation();
                        divNavigation[0].parentNode.replaceChild(newDivNavigation.cloneNode(true), divNavigation[0]);
                        divNavigation[1].parentNode.replaceChild(newDivNavigation.cloneNode(true), divNavigation[1]);         

                        ElderScroll.isLoadingNew = false;
                    } else {
                        divThreads.appendChild(ElderScroll.createDivMessage('Something broke.', false));
                    }
                });   
            }
        }
        ElderScroll.install();
    }
});