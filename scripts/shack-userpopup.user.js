// ==UserScript==
// @name Shacknews: User Popup
// @namespace http://www.lmnopc.com/greasemonkey/
// @description Adds dropdown menus to users
// @include http://shacknews.com/*
// @include http://www.shacknews.com/*
// @match http://shacknews.com/*
// @match http://www.shacknews.com/*
// @exclude http://www.shacknews.com/frame_chatty.x*
// @exclude http://bananas.shacknews.com/*
// @exclude http://*.gmodules.com/*
// @exclude http://*.facebook.com/*
// ==/UserScript==
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
            ret.replaceHTML('&nbsp;');
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

    function drawProfile(data)
    {
        username = data['data']['username'];

        pDiv = document.createElement('div');
        pDiv.className = 'tw-profile';

        pDiv.appendChild(createTextWrapper('h2', username));

        // Create General panel
        pnl = document.createElement('div');
        pnl.className = 'tw-panel';

        pnl.appendChild(createTextWrapper('h3', 'General'));

        dl = document.createElement('dl');

        dl.appendChild(createTextWrapper('dt', 'Age'));
        dl.appendChild(createTextWrapper('dd', data['data']['age']));

        dl.appendChild(createTextWrapper('dt', 'Location'));
        dl.appendChild(createTextWrapper('dd', data['data']['location']));

        dl.appendChild(createTextWrapper('dt', 'Gender'));
        dl.appendChild(createTextWrapper('dd', data['data']['gender']));

        dl.appendChild(createTextWrapper('dt', username + '\'s Posts', 'https://www.shacknews.com/user/' + username + '/posts'));

        var actualUser = '&user=' + encodeURIComponent(getShackUsername());
        dl.appendChild(createTextWrapper('dt', '[lol]: Shit ' + username + ' Wrote', 'https://lol.lmnopc.com/user.php?authoredby=' + username + actualUser));

        // Create menu item for reading post count
        var aPostCount = document.createElement('a');
        aPostCount.appendChild(document.createTextNode('Get Post Count'));
        aPostCount.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); getPostCount(username) }, false);
        dt = document.createElement('dt');
        dt.appendChild(aPostCount);
        dl.appendChild(dt);

        pnl.appendChild(dl);

        pDiv.appendChild(pnl);

        // Create Accounts panel
        pnl = document.createElement('div');
        pnl.className = 'tw-panel';

        pnl.appendChild(createTextWrapper('h3', 'Accounts'));

        dl = document.createElement('dl');

        accounts = data['data']['services'];
        if (accounts != null)
        {
            for (i = 0, ii = accounts.length; i < ii; i++)
            {
                dl.appendChild(createTextWrapper('dt', accounts[i]['service']));
                dl.appendChild(createTextWrapper('dd', accounts[i]['user']));
            }
        }

        pnl.appendChild(dl);

        pDiv.appendChild(pnl);

        // Create About panel
        pnl = document.createElement('div');
        pnl.className = 'tw-panel';

        pnl.appendChild(createTextWrapper('h3', 'About'));
        pnl.appendChild(createTextWrapper('div', data['data']['about']));

        pDiv.appendChild(pnl);

        // Add close button
        btn = document.createElement('div');
        btn.className = 'tw-close';
        btn.appendChild(document.createTextNode('CLOSE'));
        btn.setAttribute('title', 'Close Profile');
        btn.addEventListener('click', function(e) { e.target.parentNode.style.display = 'none'; }, false);

        pDiv.appendChild(btn);

        // Add profile to page
        document.getElementsByTagName('body')[0].appendChild(pDiv);
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

    function getPostCount(username)
    {
        displayWorkingBar('Retrieving post counts...');

        const usernameLowercase = username.toLowerCase();

        xhrRequest({
            type: "GET",
            url: "https://shackstats.com/data/users_info.csv"
        }).then(response => {
            // papa parse is too slow to parse this whole csv file so filter it down to likely lines using a fast
            // method and then use papa parse to parse that vastly shortened csv file
            const csvLines = response.split('\n');
            const filteredCsvLines = [];
            for (const csvLine of csvLines) {
                if (filteredCsvLines.length === 0 || csvLine.toLowerCase().includes(usernameLowercase)) {
                    filteredCsvLines.push(csvLine);
                }
            }

            const csv = Papa.parse(filteredCsvLines.join('\n'), { header: true });

            hideWorkingBar();

            var count = 0;
            for (const row of csv.data) {
                if (row.username.toLowerCase() === usernameLowercase) {
                    count = row.post_count;
                }
            }

            // use setTimeout so that the loading bar disappears before we show the modal alert
            setTimeout(() => alert(username + ' has ' + addCommas(count) + ' posts'), 0);
        }).catch(() => {
            alert('Unable to load the post counts.');
        });
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
            var postsUrl = getSetting("enabled_scripts").contains("use_winchatty_search")
                ? 'https://winchatty.com/nusearch?a=' + username
                : 'https://www.shacknews.com/user/' + username + '/posts';
            ulUser.appendChild(createListItem(your + ' Posts', postsUrl));

            var vanityUrl = getSetting("enabled_scripts").contains("use_winchatty_search")
                ? 'https://winchatty.com/nusearch?q=' + username
                : 'https://www.shacknews.com/search?chatty=1&type=4&chatty_term=' + username + '&chatty_user=&chatty_author=&chatty_filter=all&result_sort=postdate_desc';
            ulUser.appendChild(createListItem(vanitySearch, vanityUrl));

            var repliesUrl = getSetting("enabled_scripts").contains("use_winchatty_search")
                ? 'https://winchatty.com/nusearch?pa=' + username
                : 'https://www.shacknews.com/search?chatty=1&type=4&chatty_term=&chatty_user=&chatty_author=' + username + '&chatty_filter=all&result_sort=postdate_desc';
            ulUser.appendChild(createListItem(parentAuthor, repliesUrl, 'userDropdown-separator'));

            // Include reference to person actually sitting behind the keyboard in all links to lol page
            var actualUser = '&user=' + encodeURIComponent(getShackUsername());

            ulUser.appendChild(createListItem('[lol] : Stuff ' + friendlyName + ' Wrote', 'https://lol.lmnopc.com/user.php?authoredby=' + username + actualUser, 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : Stuff ' + friendlyName + ' [lol]\'d', 'https://lol.lmnopc.com/user.php?loldby=' + username + actualUser, 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : Stuff ' + friendlyName + ' [inf]\'d', 'https://lol.lmnopc.com/user.php?tag=inf&loldby=' + username + actualUser, 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : Stuff ' + friendlyName + ' [tag]\'d', 'https://lol.lmnopc.com/user.php?tag=tag&loldby=' + username + actualUser, 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : Stuff ' + friendlyName + ' [unf]\'d', 'https://lol.lmnopc.com/user.php?tag=unf&loldby=' + username + actualUser, 'userDropdown-lol'));
            ulUser.appendChild(createListItem('[lol] : ' + your + ' Fan Train', 'https://lol.lmnopc.com/user.php?fanclub=' + username + actualUser, 'userDropdown-lol userDropdown-separator'));

            // Create menu item for reading post count
            var aPostCount = document.createElement('a');
            aPostCount.appendChild(document.createTextNode('Get ' + your + ' Post Count'));
            aPostCount.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); getPostCount(decodeURIComponent(username)) }, false);
            var liPostCount = document.createElement('li');
            liPostCount.appendChild(aPostCount);
            ulUser.appendChild(liPostCount);

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
            var pp = p.parentNode;
            var ppp = pp.parentNode;

            // Post author clicked
            if ((t.tagName == 'A') && (p.tagName == 'SPAN') && (p.className == 'user'))
            {
                e.preventDefault();
                e.stopPropagation();

                displayUserMenu(t, t.innerHTML, t.innerHTML);
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
                displayUserMenu(t, t.innerHTML, 'You');
            }
            else {

                var parentDropdown = e.target;
                while (parentDropdown != null
                    && Object.prototype.toString.call(parentDropdown) != "[object HTMLDocument]") {
                    if (parentDropdown.className.split(' ').indexOf('userDropdown') > -1) {
                        parentDropdown.className += ' hidden';
                        break;
                    }
                    parentDropdown = parentDropdown.parentNode;
                }
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
