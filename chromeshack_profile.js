settingsLoadedEvent.addHandler(function()
{
    ProfilePage = 
    {
        LOL_URL: "http://www.lmnopc.com/greasemonkey/shacklol/",

        getUsername: function()
        {
            var header = document.getElementsByTagName("h3");
            return header[0].innerText;
        },

        install: function()
        {
            var person = ProfilePage.getUsername();
            if (person.length > 0)
            {
                var lols = document.createElement("a");
                lols.style.color = 'white';
                lols.innerHTML = ' [<span style="color: orange; font-size: inherit; font-weight: bold; margin: 0; padding: 0 4px;">lol</span>]';
                lols.href = ProfilePage.LOL_URL + "user.php?authoredby=" + escape(person);
                lols.target = "_blank";

                document.getElementsByTagName("h3")[0].appendChild(lols);

                var status = getDescendentByTagAndClassName(document, 'ul', 'status');

                var use_winchatty_search = getSetting("enabled_scripts").contains("winchatty_comments_search");

                if (use_winchatty_search)
                {
                    var comments = status.lastElementChild.firstElementChild;
                    comments.href = "http://winchatty.com/search.php?author=" + escape(person);
                }

                var vanity_url = 'http://www.shacknews.com/search.x?type=comments&terms=' + escape(person) + '&cs_user=&cs_parentauthor=&s_type=all';
                if (use_winchatty_search)
                    vanity_url = 'http://winchatty.com/search.php?terms=' + escape(person);

                var parent_url = 'http://www.shacknews.com/search.x?type=comments&terms=&cs_user=&cs_parentauthor=' + escape(person) + '&s_type=all';
                if (use_winchatty_search)
                    parent_url = 'http://winchatty.com/search.php?parentAuthor=' + escape(person);

                var search = document.createElement("li");
                search.innerHTML = '<a href="' + vanity_url + '">Vanity Search</a>';
                status.appendChild(search);

                var parent_author = document.createElement("li");
                parent_author.innerHTML = '<a href="' + parent_url + '">Parent Author</a>';
                status.appendChild(parent_author);
            }
        }
    }

    ProfilePage.install();
});
