settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("lol"))
    {
        LOL =
        {
            URL: "http://www.lmnopc.com/greasemonkey/shacklol/",
            COUNT_URL: "http://www.lmnopc.com/greasemonkey/shacklol/api.php?special=getcounts",
            VERSION: "20090513",

            tags: getSetting("lol_tags"),
            showCounts: getSetting("lol_show_counts"),

            counts: null,
            processed_posts: false,

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

                if (LOL.showCounts)
                {
                    LOL.counts = getSetting("lol-counts");

                    var last_lol_count_time = getSetting("lol-counts-time");
                    if (!last_lol_count_time || (new Date().getTime() - last_lol_count_time) > 120000)
                    {
                        console.log("need lol counts");
                        LOL.getCounts();
                    }
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

                if (LOL.counts)
                    LOL.showThreadCounts(id);
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
            },

            finishPosts: function()
            {
                // mark the posts as finished
                LOL.processed_posts = true;
            },

            showThreadCounts: function(threadId)
            {
                var rootId = -1; 
            
                // Make sure this is a rootId 
                if (document.getElementById('root_' + threadId))
                {
                    rootId = threadId; 
                }
                else
                {
                    // If this is a subthread, the root needs to be found
                    var liItem = document.getElementById('item_' + threadId); 
                    if (liItem)
                    {
                        do 
                        {
                            liItem = liItem.parentNode; 
                            
                            if (liItem.className == 'root')
                            {
                                rootId = liItem.id.split('_')[1];
                                break;
                            }
                        }
                        while (liItem.parentNode != null)
                    }
                }
                
                if (rootId == -1)
                {
                    console.log('Could not find root for ' + threadId); 
                    return; 
                }
            
                // If there aren't any tagged threads in this root there's no need to proceed 
                if (!LOL.counts[rootId])
                {
                    console.log('No lols for ' + rootId);
                    return; 
                }
                
                // Update all the ids under the rootId we're in 
                for (id in LOL.counts[rootId])
                {	
                    for (tag in LOL.counts[rootId][id])
                    {
                        // Add * x indicators in the fullpost 
                        var tgt = document.getElementById(tag + id); 
                        if (tgt)
                        {
                            if (tgt.innerHTML.indexOf(' × ') == -1)
                            {
                                tgt.innerHTML += ' &times; ' + LOL.counts[rootId][id][tag];
                            } 
                        }
                        else
                        {
                            console.log(tag + id + ' not found');
                        }
                    
                        // Add (lol * 3) indicators to the onelines
                        if (!document.getElementById('oneline_' + tag + 's_' + id))
                        {
                            tgt = document.getElementById('item_' + id);
                            if (tgt)
                            {
                                tgt = getDescendentByTagAndClassName(tgt, 'div', 'oneline');
                                if (tgt) 
                                {
                                    divOnelineTags = document.createElement('div'); 
                                    divOnelineTags.id = 'oneline_' + tag + 's_' + id;
                                    divOnelineTags.className = 'oneline_tags'; 
                                    tgt.appendChild(divOnelineTags);
                                    
                                     // add the button 
                                    spanOnelineTag = document.createElement('span'); 
                                    spanOnelineTag.id = 'oneline_' + tag + '_' + id;
                                    spanOnelineTag.className = 'oneline_' + tag;  
                                    spanOnelineTag.appendChild(document.createTextNode(tag + ' * ' + LOL.counts[rootId][id][tag])); 
                                    divOnelineTags.appendChild(spanOnelineTag); 
                                }
                            }
                        }
                    }
                }
            },

            getCounts: function()
            {
                console.log("getting lol counts");
                getUrl(LOL.COUNT_URL, function(response)
                {
                    console.log("response status: " + response.status);
                    console.log("response text: " + response.responseText);
                    if (response.status == 200)
                    {
                        console.log("got lol counts");
                        LOL.counts = JSON.parse(response.responseText);
                        setSetting("lol-counts", LOL.counts);
                        setSetting("lol-counts-time", new Date().getTime());
                        LOL.displayCounts();
                    }
                });
            },

            displayCounts: function(counts)
            {
                // only do this if the posts have already been processed, otherwise
                // each post will handle displaying its own counts
                if (LOL.processed_posts)
                {
                    console.log("too slow!");
                    // this should go through and re-update all the root posts with their new tags, but whatever
                }
            }

        }

        LOL.installLink();
        processPostEvent.addHandler(LOL.installButtons);
        fullPostsCompletedEvent.addHandler(LOL.finishPosts);
    }
});
