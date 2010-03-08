WinChattySearch =
{
    install: function()
    {
        var searchbuttons = document.getElementById("searchbuttons");

        // add the "chatty" button
        var button = document.createElement("a");
        button.href="#";
        button.setAttribute('onmouseover', 'searchTypeMouseOverHandler(this);');
        button.title = "Search with WinChatty Search";
        button.id = "searchchatty";
        button.appendChild(document.createTextNode("Chatty"));
        searchbuttons.appendChild(button);

        // since submitting the form programatically doesn't call our submit event handler,
        // replace all the onclick events with our own that does the same exact thing except
        // it calls fixSearchAction before submitting.
        for (var i = 0; i < searchbuttons.children.length; i++)
        {
            // make sure this is really a link first
            var link = searchbuttons.children[i];
            if (link.nodeName == "A")
            {
                link.setAttribute("onclick", "");
                link.addEventListener("click", WinChattySearch.setSearchType);
            }
        }

        var form = document.getElementById("searchboxes");
        form.addEventListener("submit", WinChattySearch.fixSearchAction);
    },

    setSearchType: function(e)
    {
        var tgt = e.target;

        // the following code is mostly copied from shack.js
        var searchType = tgt.id.substr(6);

        var s = document.getElementById('s'); 
        var st = document.getElementById('search_type'); 

        var oldSearchType = st.value;

        if (oldSearchType == searchType)
        {
            return false;
        }

        if (WinChattySearch.isSearchTextDefault())
        {
            s.value = '';
        }

        st.value = searchType; 

        if (s.value.length == 0)
        {
            s.value = WinChattySearch.getDefaultSearchText(searchType);
        }

        document.getElementById('search' + oldSearchType).className = "";
        document.getElementById('search' + searchType).className = "active";

        if (WinChattySearch.isSearchTextDefault() == false)
        {
            var tf = document.getElementById( "searchboxes" );
            WinChattySearch.fixSearchAction();
            tf.submit();
        }
        else
        {
            s.value = ''; 
            s.focus();
        }
        e.preventDefault();
    },

    // the following code is mostly copied from shack.js
    isSearchTextDefault: function()
    {
        var s = document.getElementById("s").value; 
        
        if (s == 'Search the Shack...')
        {
            return true;
        }
        else if (s == WinChattySearch.getDefaultSearchText(document.getElementById('search_type').value))
        {
            return true; 
        }

        return false
    },

    // the following code is mostly copied from shack.js
    getDefaultSearchText: function(searchType)
    {
        var st = document.getElementById('search' + searchType);
        if (st == null)
        {
            return 'Search the Shack...';
        }
        else
        {
            return st.getAttribute('title');
        }
    },

    fixSearchAction: function()
    {
        var st = document.getElementById("search_type");
        var form = document.getElementById("searchboxes");

        if (st.value == "chatty")
        {
            // "chatty" is selected, do the winchatty search
            var s = document.getElementById("s");
            form.target = "_blank";
            form.action = "http://winchatty.com/search.php?terms=" + s.value + "&author=parentAuthor=";
        }
        else
        {
            // reset the form back, do a regular search
            form.target = "";
            form.action = "/search.x";
        }
    }



}

WinChattySearch.install();
