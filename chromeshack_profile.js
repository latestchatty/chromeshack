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
            var search = document.createElement("li");
            search.innerHTML = '<a href="http://www.shacknews.com/search.x?type=comments&terms=' + escape(person.replace('_', '')) + '&cs_user=">Vanity Search</a>';
            status.appendChild(search);

            var parent_author = document.createElement("li");
            parent_author.innerHTML = '<a href="http://www.shacknews.com/search.x?type=comments&terms=&cs_user=&cs_parentauthor=' + escape(person) + '&s_type=all">Parent Author</a>';
            status.appendChild(parent_author);
        }
    }
}

ProfilePage.install();
