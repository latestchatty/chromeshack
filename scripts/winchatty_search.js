WinChattySearch =
{
    install: function()
    {
        // redirect searchbox to winchatty
        // disabled at least until electorly gets things working again
        /*
        var searchbox = document.getElementById("search_box");
        searchbox.action = "http://winchatty.com/search.php";
        var text = document.getElementById("searchbox");
        text.name = "terms";
        */

        var liUser = getDescendentByTagAndClassName(document.getElementById('user'), 'li', 'user');
        if (liUser != null)
        {
            // liUser.innerHTML = '<a href="http://www.shacknews.com/search?q=' + encodeURIComponent(stripHtml(liUser.innerHTML)) + '&type=4">' + liUser.innerHTML + '</a>';
            liUser.innerHTML = '<a href="http://winchatty.com/search.php?author=&parentAuthor=&category=&terms=' + encodeURIComponent(stripHtml(liUser.innerHTML)) + '" title="WinChatty-powered Vanity Search">' + liUser.innerHTML + '</a>';
        }	
    },
}

WinChattySearch.install();
