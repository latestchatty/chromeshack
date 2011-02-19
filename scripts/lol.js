settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("lol"))
    {
        LOL =
        {
            URL: "http://www.lmnopc.com/greasemonkey/shacklol/",
            VERSION: "20090513",

            tags: getSetting("lol_tags"),

            installLink: function()
            {
                var comments_tools = getDescendentByTagAndClassName(document, "div", "commentstools");
                if (comments_tools)
                {
                    var link = document.createElement("a");
                    link.id = "lollink";
                    link.href = LOL.URL + "?user=" + encodeURIComponent(LOL.getUsername());
                    link.title = "Check out what got the [lol]s";
                    link.style.backgroundImage = "url(" + chrome.extension.getURL("../images/lol.png") + ")";
                    link.appendChild(document.createTextNode("[ L O L ` d ]"));
                    comments_tools.appendChild(link);
                }
            },

            installButtons: function(item, id)
            {
                var lol_div_id = 'lol_' + id;
                
                // buttons already installed here
                if (document.getElementById(lol_div_id) != null)
                    return;

                var author = getDescendentByTagAndClassName(item, "span", "author");
                if (!author)
                {
                    console.error("getDescendentByTagAndClassName could not locate span.author");
                    return;
                }

                var lol_div = document.createElement("div");
                lol_div.id = lol_div_id;
                lol_div.className = "lol";
                
                // generate all the buttons from settings
                for (var i = 0; i < LOL.tags.length; i++)
                {
                    lol_div.appendChild(LOL.createButton(LOL.tags[i].name, id, LOL.tags[i].color));
                }

                // add them in
                author.appendChild(lol_div);
            },

            createButton: function(tag, id, color)
            {
                var button = document.createElement("a");
                button.id = tag + id;
                button.href = "#";
                button.className = "lol_button";
                button.style.color = color;
                button.innerText = tag;

                button.addEventListener("click", function(e)
                {
                    LOL.lolThread(tag, id, arguments.callee)
                    e.preventDefault();
                });

                var span = document.createElement("span");
                span.appendChild(document.createTextNode("["));
                span.appendChild(button);
                span.appendChild(document.createTextNode("]"));

                return span;
            },

            lolThread: function(tag, id, handler)
            {
                var user = LOL.getUsername();
                if (!user)
                {
                    alert("You must be logged in to lol!");
                    return;
                }
                
                var moderation = LOL.getModeration(id);
                if (moderation.length)
                    moderation = "&moderation=" + moderation;

                var url = LOL.URL + "report.php?who=" + user + "&what=" + id + "&tag=" + tag + "&version=" + LOL.VERSION +  moderation;

                getUrl(url, function(response)
                {
                    if (response.status == 200 && response.responseText.indexOf("ok") == 0)
                    {
                        // looks like it worked
                        var new_tag = "*";
                        for (var i = 0; i < tag.length; i++)
                            new_tag += " " + tag[i].toUpperCase() + " ";
                        new_tag += " ' D *";

                        var tag_link = document.getElementById(tag + id);
                        tag_link.href = LOL.URL + "?user=" + encodeURIComponent(user);
                        tag_link.innerHTML = new_tag;
                        tag_link.removeEventListener('click', handler);
                    }
                    else
                    {
                        alert(response.responseText);
                    }
                });
            },

            getUsername: function()
            {
                var masthead = document.getElementById("user");
                var username = getDescendentByTagAndClassName(masthead, "li", "user");
                if (!username) return '';
                return stripHtml(username.innerHTML);
            },

            getModeration: function(id)
            {
                var tags = ["fpmod_offtopic", "fpmod_nws", "fpmod_stupid", "fpmod_informative", "fpmod_political"];
                var item = document.getElementById("item_" + id);
                var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");
                for (var i = 0; i < tags.length; i++)
                {
                    if (fullpost.className.indexOf(tags[i]) >= 0)
                    {
                        return tags[i];
                    }
                }

                return "";
            }

        }

        LOL.installLink();
        processPostEvent.addHandler(LOL.installButtons);
    }
});
