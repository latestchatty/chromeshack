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
	
	DO *NOT* RUN ALONG WITH THE CURRENT REVISION OF THE [LOL] SCRIPT UNLESS
	YOU LIKE YOUR SHIT FUCKED UP ALL OVER THE PLACE.
	
	2011-04-26
		* First stab at profiles   

*/
(function() {

	// grab start time of script
	var benchmarkTimer = null;
	var scriptStartTime = getTime();

	function tw_log(str) { GM_log(str); }
	function getTime() { benchmarkTimer = new Date(); return benchmarkTimer.getTime(); }

	// Library functions 
	if (typeof(GM_log) == 'undefined') { GM_log = function(message) { console.log(message); } }
	if (typeof(GM_addStyle) == 'undefined') { GM_addStyle = function(css) { var style = document.createElement('style'); style.textContent = css; document.getElementsByTagName('head')[0].appendChild(style); } }
	function getElementByClassName(oElm, strTagName, strClassName) { try { var arrElements = oElm.getElementsByTagName(strTagName); for(var i=0; i < arrElements.length; i++) { if (arrElements[i].className.indexOf(strClassName) == 0) { return arrElements[i]; } } } catch (ex) { return null; } }
	function stripHtml(html) { return String(html).replace(/(<([^>]+)>)/ig, ''); }
	function trim(str) { return String(str).replace(/^\s+|\s+$/g,""); }
	function removeClassName(obj, className) { var a = obj.className.split(' '); var i = a.indexOf(className); if (i != -1) { a.splice(i, 1); }obj.className = a.join(' '); }
	function addCommas(nStr) { nStr += ''; x = nStr.split('.'); x1 = x[0]; x2 = x.length > 1 ? '.' + x[1] : ''; var rgx = /(\d+)(\d{3})/; while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1' + ',' + '$2'); } return x1 + x2; }

	GM_addStyle(
		'#user .user { position: relative; cursor: pointer; }'
		+ '#user .user .hidden { display: none; }'
		+ 'span.author { position: relative !important; }'
		+ 'span.author span.user { cursor: pointer; }'
		+ 'div.commentsblock span.author span.user a { text-decoration: none; }'
		+ 'span.author .userdropdown,'
		+ '.userDropdown { position: absolute !important; top: 1.5em; left: 0; width: 20em !important; background: #222 !important; z-index: 9999; text-align: left; border: 1px solid #333; -moz-box-shadow: 3px 3px 4px #000; font-weight: normal; font-size: 12px; }'
		+ 'span.author .userdropdown li,'
		+ '.userDropdown li { background-color: inherit; margin: 0; padding: 0 !important; background-image: none !important;  display: block; width: 100%; line-height: 2.5em; border-bottom: 1px solid #333; z-index: 9999; }'
		+ 'span.author .userDropdown li.userDropdown-separator ,'
		+ '.userDropdown li.userDropdown-separator { border-bottom: 1px solid #666; }'
		+ 'span.author .userDropdown li a,' 
		+ '.userDropdown li a { display: block; width: 100%; margin: 0 1em; padding: 0; color: #ddd; font-weight: normal; font-size: 12px; }'
		+ 'span.author .userDropdown li a:hover,'
		+ '.userDropdown li a:hover { color: #fff; text-shadow: 0 0 10px #fff; text-decoration: underline !important; }'
		+ '#lolWorkingBar { position: fixed; left: 0; bottom: 0; height: 2.5em; width: 100%; line-height: 2.5em; background-color: #000; color: #fff; font-size: 150%; font-weight: bold; display: none; text-align: center; }'
		+ '.tw-profile { position: fixed; width: 630px; height: 320px; border: 1px solid #444; padding: 10px 10px 10px 0; overflow: auto; top: 50%; margin-top: -160px; left: 50%; margin-left: -320px; background: #000; color: #fff; z-index: 9999; font-size: 12px; border-radius: 10px; }'
		+ '.tw-profile a { color: #fff; }'
		+ '.tw-profile h2 { margin: 4px 0; padding: 0 0 0 10px; font-size: 20px; font-weight: bold; }' 
		+ '.tw-profile .tw-panel { float: left; width: 200px; height: 280px; overflow: auto; margin-left: 10px; }'
		+ '.tw-profile .tw-accounts { margin-left: 10px; }'
		+ '.tw-profile .tw-panel h3 { margin: 0; font-size: 14px; font-weight: bold; background-color: #333; padding: 2px 4px; border-radius: 3px; }' 
		+ '.tw-profile .tw-panel dl { margin: 0; padding: 0 0 0.5em 0; border-bottom: 1px dashed #333; }'
		+ '.tw-profile .tw-panel dl dt { font-weight: bold; margin: 0.5em 0 0 0 ; border-top: 1px dashed #333; padding-top: 0.5em;   }'
		+ '.tw-profile .tw-panel dl dt:first-child { border-top: none; padding-top: 0; }'
		+ '.tw-profile .tw-panel dl dd { margin: 0; padding: 0 0 0 0.5em; }'
		+ '.tw-profile .tw-close { position: fixed; top: 50%; left: 50%; margin-top: 180px; margin-left: -2.5em; background: #800; font-size: 18px; padding: 4px 10px; font-weight: bold; cursor: pointer; -moz-border-radius: 10px; width: 5em; text-align: center;  }'
	);
	
	function findUsername()
	{
		return stripHtml(getElementByClassName(document.getElementById('user'), 'li', 'user').firstChild.innerText);
	}
	
	function createTextWrapper(tag, text, url)
	{	
		var ret = document.createElement(tag);
		
		if (text == null) 
		{
			ret.innerHTML = '&nbsp;'; 
		}
		else if (text.length == 0)
		{
			ret.innerHTML = '&nbsp;'; 
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
		
		dl.appendChild(createTextWrapper('dt', username + '\'s Posts', 'http://www.shacknews.com/user/' + username + '/posts')); 

		var actualUser = '&user=' + encodeURIComponent(findUsername()); 
		dl.appendChild(createTextWrapper('dt', '[lol]: Shit ' + username + ' Wrote', 'http://lmnopc.com/greasemonkey/shacklol/user.php?authoredby=' + username + actualUser));
		
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
	
	function displayProfile(username)
	{
		// Scrub username
		username = trim(stripHtml(username));
	
		// Display working... message		
		displayWorkingBar('Retrieving profile data for ' + username + '...'); 
	
		// 
		var addr = 'http://gamewith.us/_widgets/shack-profile-popup.php?user=' + encodeURIComponent(username); 
        console.log(addr);
		
		// use xmlhttpRequest to post the data
        getUrl(addr, function(response) {
				
				hideWorkingBar();
				
				var data = null; 
				
				try 
				{
					data = JSON.parse(response);  
				}
				catch (ex)
				{
					alert('Profile retrieval failed: ' + ex.message);
					return;  
				}
				
				if (data['status'] == '0')
				{
					alert(data['message']); 
					return;
				} 
				
				drawProfile(data); 
			}
	  	);
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
		// Display working... message		
		displayWorkingBar('Retrieving post count for ' + username + '...'); 
	
		// 
		var addr = 'http://shackapi.stonedonkey.com/postcount/' + encodeURIComponent(username) + '.json'
        console.log(addr);
		
		// use xmlhttpRequest to post the data
        getUrl(addr, function(response) {
				
				hideWorkingBar();
				
				var postCount = JSON.parse(response);
				
				alert(postCount['user'] + ' has ' + addCommas(postCount['count']) + ' posts');
			}
	  	);
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
			}
			else
			{
				your = friendlyName + '\'s'; 
				vanitySearch = 'Search for "' + friendlyName + '"'; 
				parentAuthor = friendlyName + ': Parent Author Search'; 
			}
		
			// Create menu items and add them to ulUser
			ulUser.appendChild(createListItem('View ' + your + ' Profile', 'http://chattyprofil.es/p/' + username, 'userDropdown-separator', '_blank'));
			ulUser.appendChild(createListItem(your + ' Posts', 'http://www.shacknews.com/user/' + username + '/posts')); 		
			ulUser.appendChild(createListItem(vanitySearch, 'http://www.shacknews.com/search?chatty=1&type=4&chatty_term=' + username + '&chatty_user=&chatty_author=&chatty_filter=all&result_sort=postdate_desc'));
			ulUser.appendChild(createListItem(parentAuthor, 'http://www.shacknews.com/search?chatty=1&type=4&chatty_term=&chatty_user=&chatty_author=' + username + '&chatty_filter=all&result_sort=postdate_desc', 'userDropdown-separator'));

			// Include reference to person actually sitting behind the keyboard in all links to lol page
			var actualUser = '&user=' + encodeURIComponent(findUsername()); 

			ulUser.appendChild(createListItem('[lol] : Shit ' + friendlyName + ' Wrote', 'http://lmnopc.com/greasemonkey/shacklol/user.php?authoredby=' + username + actualUser, 'userDropdown-lol'));
			ulUser.appendChild(createListItem('[lol] : Shit ' + friendlyName + ' [lol]\'d', 'http://lmnopc.com/greasemonkey/shacklol/user.php?loldby=' + username + actualUser, 'userDropdown-lol')); 		
			ulUser.appendChild(createListItem('[lol] : Shit ' + friendlyName + ' [inf]\'d', 'http://lmnopc.com/greasemonkey/shacklol/user.php?tag=inf&loldby=' + username + actualUser, 'userDropdown-lol'));
			ulUser.appendChild(createListItem('[lol] : Shit ' + friendlyName + ' [tag]\'d', 'http://lmnopc.com/greasemonkey/shacklol/user.php?tag=tag&loldby=' + username + actualUser, 'userDropdown-lol'));
			ulUser.appendChild(createListItem('[lol] : Shit ' + friendlyName + ' [unf]\'d', 'http://lmnopc.com/greasemonkey/shacklol/user.php?tag=unf&loldby=' + username + actualUser, 'userDropdown-lol'));
			ulUser.appendChild(createListItem('[lol] : ' + your + ' Fan Train', 'http://lmnopc.com/greasemonkey/shacklol/user.php?fanclub=' + username + actualUser, 'userDropdown-lol userDropdown-separator'));
			
			// Create menu item for reading post count
			var aPostCount = document.createElement('a');
			aPostCount.appendChild(document.createTextNode('Get ' + your + ' Post Count'));
			aPostCount.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); getPostCount(username) }, false);  
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
		var t = e.target; 
		var p = t.parentNode;
		var pp = p.parentNode;
		var ppp = pp.parentNode;
		
		// Post author clicked 
		if ((t.tagName == 'A') && (p.tagName == 'SPAN') && (p.className == 'user'))
		{
			e.preventDefault();
			e.stopPropagation();

			/*			
			if (navigator.userAgent.indexOf('Firefox') !== -1)
			{
				displayProfile(t.innerHTML);
			}
			else
			{
				displayUserMenu(t, t.innerHTML, t.innerHTML);
			}
			*/
			displayUserMenu(t, t.innerHTML, t.innerHTML);
		}
		
		// User name clicked
		else if ((t.tagName == 'A') && (p.className == 'user light') && (ppp.tagName == 'DIV') && (ppp.id == 'user'))
		{
			e.preventDefault();
			e.stopPropagation();
			
			displayUserMenu(t, t.innerHTML, 'You');
		}
		
		// OWN user name clicked as post author
		if ((t.tagName == 'A') && (p.tagName == 'SPAN') && (p.className == 'user this-user'))
		{
			e.preventDefault();
			e.stopPropagation();

			/*
			if (navigator.userAgent.indexOf('Firefox') !== -1)
			{
				displayProfile(t.innerHTML);
			}
			else
			{ 
				displayUserMenu(t, t.innerHTML, 'You');
			}
			*/
			displayUserMenu(t, t.innerHTML, 'You');
		}
	}, false); 

	// log execution time
	tw_log(location.href + ' / ' + (getTime() - scriptStartTime) + 'ms');
	
})();
