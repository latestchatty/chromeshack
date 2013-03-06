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

            install: function()
            {
                if (ElderScroll.getDivNavigation() != 0)
                {
                    window.addEventListener('scroll', ElderScroll.reachedBottom, false);
                    window.addEventListener('resize', ElderScroll.reachedBottom, false);
                }
            },
            
            createDivMessage: function(text, addLoadingAnimation)
            {
                var divLoadingInfo = document.createElement('div');
                divLoadingInfo.id = 'elderscroll-message';
                divLoadingInfo.appendChild(document.createTextNode(text));
                
                //divLoadingInfo.innerText = text;
                
                if (addLoadingAnimation)
                {
                    var shackLogo = document.createElement('div');
                    shackLogo.id = 'shackLogo';
                    //.setAttribute("border", "100");
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

                        for (var i = 0; i < newDivThreads.childNodes.length; ++i)
                        {
                            fragment.appendChild(newDivThreads.childNodes[i].cloneNode(true));
                        }
                        
                        /**
                        *   TODO: Speed up this really slow operation somehow.
                        *      This is probably due to the other content scripts all firing.  The
                        *      more the user has enabled, the slower this entire operation is.
                        **/
                        divThreads.appendChild(fragment.cloneNode(true));
                        
                        /** 
                        * Just appending the new threads and their parent container is much faster,
                        * but the other content scripts won't be able to modify the new threads as
                        * they're no longer direct children of the original thread div.
                        *
                        * divThreads.appendChild(newDivThreads);
                        **/

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