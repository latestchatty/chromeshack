/*
    Shack: User Popup
    (ↄ)2011 Thom Wetzel

    This is the user menu stuff stripped out of the [lol] Greasemonkey script

    2011-04-26
        * First stab at profiles
*/
(function() {

    // grab start time of script
    var benchmarkTimer = null;
    var scriptStartTime = getTime();

    function getTime() { benchmarkTimer = new Date(); return benchmarkTimer.getTime(); }

    // Library functions
    function getElementByClassName(oElm, strTagName, strClassName) { try { var arrElements = oElm.getElementsByTagName(strTagName); for(var i=0; i < arrElements.length; i++) { if (arrElements[i].className.indexOf(strClassName) == 0) { return arrElements[i]; } } } catch (ex) { return null; } }
    function stripHtml(html) { return String(html).replace(/(<([^>]+)>)/ig, ''); }
    function trim(str) { return String(str).replace(/^\s+|\s+$/g,""); }
    function removeClassName(obj, className) { var a = obj.className.split(' '); var i = a.indexOf(className); if (i != -1) { a.splice(i, 1); }obj.className = a.join(' '); }
    function addCommas(nStr) { nStr += ''; x = nStr.split('.'); x1 = x[0]; x2 = x.length > 1 ? '.' + x[1] : ''; var rgx = /(\d+)(\d{3})/; while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1' + ',' + '$2'); } return x1 + x2; }

    function isLoggedIn()
    {
        return document.getElementById('user_posts') != null;
    }

    function getShackUsername()
    {
        return document.getElementById('user_posts').innerHTML;
    }

    function createTextWrapper(tag, text, url)
    {
        var ret = document.createElement(tag);

        if (text == null || text.length == 0)
        {
            ret.textContent = '&nbsp;';
        }
        else
        {
            if (url != null)
            {
                if (url.length)
                {
                    var a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';

                    a.appendChild(document.createTextNode(text));

                    ret.appendChild(a);
                }
            }
            else
            {
                ret.appendChild(document.createTextNode(text));
            }
        }
        return ret;
    }

    function displayWorkingBar(message)
    {
        var workingBar = document.getElementById('lolWorkingBar');

        // Create #lolWorkingBar if it doesn't already exist
        if (workingBar == null)
        {
            workingBar = document.createElement('div');
            workingBar.id = 'lolWorkingBar';

            document.getElementsByTagName('body')[0].appendChild(workingBar);

        }
        else
        {
            // Remove child nodes (presumably prior messages)
            while (workingBar.firstChild != null)
            {
                workingBar.removeChild(workingBar.firstChild);
            }
        }

        // Create message (using createTextNode for proper escaping)
        workingBar.appendChild(document.createTextNode(message));

        // Make it visible
        workingBar.style.display = 'block';
    }

    function hideWorkingBar()
    {
        var workingBar = document.getElementById('lolWorkingBar');
        if (workingBar)
        {
            workingBar.style.display = 'none';
        }
    }

    function createListItem(text, url, className, target)
    {
        var a = document.createElement('a');
        a.href = url;
        if (typeof(target) != 'undefined') { a.target = target; }
        a.appendChild(document.createTextNode(text));

        var li = document.createElement('li');
        if (typeof(className) != 'undefined') { li.className = className; }

        // Prevent menu clicks from bubbling up
        a.addEventListener('click', function(e) { e.stopPropagation(); }, false);

        li.appendChild(a);

        return li;
    }

    function displayUserMenu(parentObj, username, friendlyName)
    {
        // Create the dropdown menu if it doesn't already exist
        ulUserDD = getElementByClassName(parentObj, 'ul', 'userDropdown');
        if (ulUserDD == null)
        {
            // Create UL that will house the dropdown menu
            var ulUser = document.createElement('ul');
            ulUser.className = 'userDropdown';

            // Scrub username
            username = encodeURIComponent(trim(stripHtml(username)));

            if (friendlyName == 'You')
            {
                your = 'Your';
                vanitySearch = 'Vanity Search';
                parentAuthor = 'Parent Author Search';

                // Add the account link to the dropdown menu
                ulUser.appendChild(createListItem('Shack Account', '/settings', 'userDropdown-lol userDropdown-separator'));
            }
            else
            {
                your = friendlyName + '\'s';
                vanitySearch = 'Search for "' + friendlyName + '"';
                parentAuthor = friendlyName + ': Parent Author Search';
            }

            // Create menu items and add them to ulUser
            var postsUrl = 'https://www.shacknews.com/user/' + username + '/posts';
            ulUser.appendChild(createListItem(your + ' Posts', postsUrl));

            var vanityUrl = 'https://www.shacknews.com/search?chatty=1&type=4&chatty_term=' + username + '&chatty_user=&chatty_author=&chatty_filter=all&result_sort=postdate_desc';
            ulUser.appendChild(createListItem(vanitySearch, vanityUrl));

            var repliesUrl = 'https://www.shacknews.com/search?chatty=1&type=4&chatty_term=&chatty_user=&chatty_author=' + username + '&chatty_filter=all&result_sort=postdate_desc';
            ulUser.appendChild(createListItem(parentAuthor, repliesUrl, 'userDropdown-separator'));

            const wasWere = friendlyName === 'You' ? 'Were' : 'Was';
            ulUser.appendChild(createListItem('[lol] : Stuff ' + friendlyName + ' Wrote', 'https://www.shacknews.com/tags-user?user=' + username + '#authored_by_tab', 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : Stuff ' + friendlyName + ' Tagged', 'https://www.shacknews.com/tags-user?user=' + username + '#lold_by_tab', 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : ' + your + ' Fan Train', 'https://www.shacknews.com/tags-user?user=' + username + '#fan_club_tab', 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : ' + wasWere + ' ' + friendlyName + ' Ever Funny?', 'https://www.shacknews.com/tags-ever-funny?user=' + username, 'userDropdown-lol'));

            // Add ulUser to the page
            parentObj.appendChild(ulUser);
        }
        else // ulUserDD already exists -- this just handles the toggling of its display
        {
            // Toggle ulUser's classname
            if (ulUserDD.className.split(' ').indexOf('hidden') == -1)
            {
                ulUserDD.className += ' hidden';
            }
            else
            {
                removeClassName(ulUserDD, 'hidden');
            }
        }
    }

    // Add catch-all event handlers for creating user dropdown menus
    document.addEventListener('click', function(e)
    {
        // try to eat exceptions that are typically harmless
        try {
            var t = e.target;
            var p = t.parentNode;
            // use the nuShack username rather than the full switcher string (if applicable)
            var matchFilteredUser = t.tagName === 'A' && /(.*?)\s\-\s\(/i.exec(t.innerHTML);
            var sanitizedUser = !!matchFilteredUser ? matchFilteredUser[1] : t.innerHTML;

            // Post author clicked
            if ((t.tagName == 'A') && (p.tagName == 'SPAN') && (p.className == 'user'))
            {
                e.preventDefault();
                e.stopPropagation();

                displayUserMenu(t, sanitizedUser, sanitizedUser);
            }

            // User name clicked (at the top of the banner?)
            else if (t.id == 'userDropdownTrigger')
            {
                e.preventDefault();
                e.stopPropagation();

                displayUserMenu(t, getShackUsername(), 'You');
            }

            // OWN user name clicked as post author
            else if ((t.tagName == 'A') && (p.tagName == 'SPAN') && (p.className == 'user this-user'))
            {
                e.preventDefault();
                e.stopPropagation();
                displayUserMenu(t, sanitizedUser, 'You');
            }
        }
        catch (e) { console.log(e) };
    }, false);

    if (isLoggedIn()) {
        // Add custom dropdown stuff to the Account button
        var $account = document.querySelector("header .header-bottom .tools ul li a[href='/settings']");
        $account.setAttribute ('id', 'userDropdownTrigger');
    }

    settingsLoadedEvent.addHandler(function() {
        if (getSetting("enabled_scripts").contains("use_winchatty_search")) {
            $('.tog-search').prop('href', 'https://winchatty.com').prop('target', '_blank');
            $(".modal.search").remove();
        }
    });

})();
