settingsLoadedEvent.addHandler(function()
{
    if (getSetting("enabled_scripts").contains("lol"))
    {
        LOL =
        {
            URL: "https://lol.lmnopc.com/",
            COUNT_URL: "https://lol.lmnopc.com/api.php?special=getcounts",
            VERSION: "20180804",

            tags: getSetting("lol_tags"),
            showCounts: getSetting("lol_show_counts"),
            ughThreshold: parseInt(getSetting('lol_ugh_threshold')),

            counts: null,
            processed_posts: false,

            posts: Array(),

            installLink: function()
            {
                var newComment = document.querySelector("#commenttools .newcomment");
                var commentTools = document.querySelector("#commenttools");
                // script is already injected
                if (document.getElementById('lollink') != null)
                    return;

                var link = document.createElement("a");
                link.id = "lollink";
                let url = LOL.URL;
                const username = LOL.getUsername();
                if (username) {
                    url += "?user=" + encodeURIComponent(username);
                }
                link.href = url;
                link.title = "Check out what got the [lol]s";
                link.replaceHTML("* L O L ' d *");
                link.style.backgroundImage = `url("${browser.runtime.getURL("../images/lol.png")}")`;
                // insert our link intelligently to preserve formatting
                if (newComment != null)
                    newComment.parentNode.insertBefore(link, newComment.nextSibling);
                else
                    commentTools.insertBefore(link, commentTools.firstChild);

                if (LOL.showCounts != 'none')
                {
                    LOL.counts = getSetting("lol-counts");

                    var last_lol_count_time = getSetting("lol-counts-time");
                    if (!last_lol_count_time || (new Date().getTime() - last_lol_count_time) > 120000)
                    {
                        LOL.getCounts();
                    }
                }
            },

            installCSS: function()
            {
                var css = '';
                for (var i = 0; i < LOL.tags.length; i++)
                {
                    css += '.oneline_tags .oneline_' + LOL.tags[i].name + ' { background-color: ' + LOL.tags[i].color + '; }\n';
                }

                var styleBlock = document.createElement('style');
                styleBlock.type = 'text/css';
                styleBlock.appendChild(document.createTextNode(css));

                document.getElementsByTagName('body')[0].appendChild(styleBlock);
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

                // put our tagger-list button at the end of the lol button array
                lol_div.appendChild(LOL.createGetUsers(id));

                // add them in
                author.appendChild(lol_div);

                if (LOL.counts)
                    LOL.showThreadCounts(id);

                LOL.posts.push(id);
            },

            createGetUsers: function(id)
            {
                var button = document.createElement("a");
                button.href = "#";
                button.innerText = " ";
                button.id = "get_lol_users_" + id;
                button.dataset.threadid = id;
                button.setAttribute("class", "who_tagged_this hidden");
                button.addEventListener("click", (e) => { LOL.getUsers(id); e.preventDefault(); });

                var icon = document.createElement("span");
                //stole from account icon in new redesign.
                icon.style.fontFamily = "Icon";
                icon.style.fontSize = "12px";
                icon.style.fontWeight = "100";
                icon.innerText = "\uea04";
                icon.title = `Show who tagged this post`;
                button.appendChild(icon);
                return button;
            },

            createButton: function(tag, id, color)
            {
                var button = document.createElement("a");
                button.id = tag + id;
                button.href = "#";
                button.className = "lol_button";
                button.style.color = color;
                button.innerText = tag;

                // store this stuff in data items instead of an anonymous handler function
                button.dataset.loltag = tag;
                button.dataset.threadid = id;

                button.addEventListener("click", LOL.lolThread);

                var span = document.createElement("span");
                span.appendChild(document.createTextNode("["));
                span.appendChild(button);
                span.appendChild(document.createTextNode("]"));

                return span;
            },

            getUsers: function(id)
            {
                var url = LOL.URL + 'api.php?special=get_taggers&thread_id=' + encodeURIComponent(id);
                var tagsExist = document.querySelector(`div[id^=taggers_${id}].tagger_container`);
                if (tagsExist != null) { return tagsExist.classList.toggle("hidden"); }

                xhrRequest({
                    type: "GET",
                    url
                }).then(res => {
                    var response = JSON.parse(res);
                    for (var _tag in response) {
                        var post = document.getElementById("item_" + id);
                        var body = post.getElementsByClassName("postbody")[0];
                        var container = document.getElementById(`taggers_${id}`);
                        if (!container) {
                            container = document.createElement("div");
                            container.id = "taggers_" + id;
                            container.setAttribute("class", "tagger_container");
                        }
                        var tagSection = document.createElement("div");
                        tagSection.className = `oneline_${_tag}s`;
                        response[_tag].sort((a, b) => a.localeCompare(b, 'en', {'sensitivity': 'base'})).forEach(tagger => {
                            var taggerNode = document.createElement("span");
                            taggerNode.className = 'oneline_' + _tag;
                            taggerNode.innerText = tagger;
                            tagSection.appendChild(taggerNode);
                        });
                        container.appendChild(tagSection);
                        body.appendChild(container);
                    }
                }).catch(err => {
                    alert("Problem getting taggers. Try again.");
                });
            },

            lolThread: function(e)
            {
                var user = LOL.getUsername();
                if (!user)
                {
                    alert("You must be logged in to lol!");
                    e.preventDefault();
                    return;
                }

                var element = e.target;
                var tag = element.dataset.loltag;
                var id = element.dataset.threadid;
                var isloled = element.dataset.isloled == 'true';

                var url = LOL.URL + "report.php";

                var data = 'who=' + user + '&what=' + id + '&tag=' + encodeURIComponent(tag) + '&version=' + LOL.VERSION;

                if (isloled) {
                    data += '&action=untag';
                } else {
                    var moderation = LOL.getModeration(id);
                    if (moderation.length)
                        data += '&moderation=' + moderation;
                }

                postFormUrl(url, data, function(response)
                {
                    if (response.status == 200 && (response.responseText.indexOf("ok") == 0 || response.responseText.indexOf("You have already") == 0))
                    {
                        // looks like it worked
                        var new_tag;
                        if (isloled) {
                           new_tag = tag;
                        } else {
                            new_tag = "*";
                            for (var i = 0; i < tag.length; i++)
                                new_tag += " " + tag[i].toUpperCase() + " ";
                            new_tag += " ' D *";
                        }

                        element.replaceHTML(new_tag);
                        element.dataset.isloled = !isloled;
                    }
                    else
                    {
                        alert(response.responseText);
                    }
                });

                e.preventDefault();
            },

            getUsername: function()
            {
                const userPostsElement = document.getElementById('user_posts');
                if (userPostsElement) {
                    return userPostsElement.innerHTML;
                } else {
                    return null;
                }
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
                    return;

                // Store the tag names in an array for easy comparisons in the loop
                var tag_names = [];
                for (var i = 0; i < LOL.tags.length; i++)
                    tag_names.push(LOL.tags[i].name);

                // Update all the ids under the rootId we're in
                for (id in LOL.counts[rootId])
                {
                    for (tag in LOL.counts[rootId][id])
                    {
                        // Evaluate [ugh]s
                        // Must be root post, ughThreshold must be enabled, tag must be ugh, and counts have to be gte the ughThreshold
                        if ((id == rootId) && (threadId == rootId) && (LOL.ughThreshold > 0) && (tag == 'ugh') && (LOL.counts[rootId][id][tag] >= LOL.ughThreshold)) {
                            var root = document.getElementById('root_' + id);
                            if (root.className.indexOf('collapsed') == -1)
                            {
                                var close = getDescendentByTagAndClassName(root, "a", "closepost");
                                var show = getDescendentByTagAndClassName(root, "a", "showpost");
                                close.addEventListener("click", function() { Collapse.close(id); });
                                show.addEventListener("click", function() { Collapse.show(id); });
                                root.className += " collapsed";
                                show.className = "showpost";
                                close.className = "closepost hidden";
                            }
                        }

                        // If showCounts is configured as limited and this tag isn't in the user's list of tags, skip it
                        if (((LOL.showCounts == 'limited') || (LOL.showCounts == 'short')) && (tag_names.indexOf(tag) == -1))
                            continue;

                        var get_users_element = document.getElementById("get_lol_users_" + tag + "_" + id);
                        if(get_users_element) {
                            get_users_element.classList.remove("hidden"); //Unhide since there are taggers.
                        }

                        // Add * x indicators in the fullpost
                        var tgt = document.getElementById(tag + id);
                        if (!tgt && id == rootId)
                        {
                            // create the button if it doesn't exist
                            var lol_button = LOL.createButton(tag, id, '#ddd');
                            var lol_div = document.getElementById('lol_' + id);
                            lol_div.appendChild(lol_button);

                            // get the link
                            tgt = document.getElementById(tag + id);
                        }

                        if (tgt)
                        {
                            if (LOL.showCounts == 'short')
                            {
                                tgt.replaceHTML(LOL.counts[rootId][id][tag]);
                            }
                            else
                            {
                                tgt.replaceHTML(`${tag} \u00d7 ${LOL.counts[rootId][id][tag]}`);
                            }
                        }

                        // toggle our LOL tagger button since we're updating
                        var taggerButton = document.querySelector(`#get_lol_users_${id}.who_tagged_this`);
                        if (taggerButton != null)
                            taggerButton.classList.remove("hidden");

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
                                    if (LOL.showCounts == 'short')
                                    {
                                        spanOnelineTag.appendChild(document.createTextNode(LOL.counts[rootId][id][tag]));
                                    }
                                    else
                                    {
                                        spanOnelineTag.appendChild(document.createTextNode(`${tag} \u00d7 ${LOL.counts[rootId][id][tag]}`));
                                    }
                                    divOnelineTags.appendChild(spanOnelineTag);
                                }
                            }
                        }
                        else
                        {
                            var span = document.getElementById('oneline_' + tag + '_' + id);
                            if (typeof(span) != 'undefined')
                            {
                                if (LOL.showCounts == 'short')
                                {
                                    span.innerText = LOL.counts[rootId][id][tag];
                                }
                                else
                                {
                                    span.innerText = tag + ' × ' + LOL.counts[rootId][id][tag];
                                }
                            }
                        }
                    }
                }
            },

            getCounts: function()
            {
                xhrRequest({
                    type: "GET",
                    url: LOL.COUNT_URL
                }).then(response => {
                    // Store original LOL.counts
                    var oldLolCounts = LOL.counts;

                    LOL.counts = JSON.parse(response);

                    setSetting("lol-counts", LOL.counts);
                    setSetting("lol-counts-time", new Date().getTime());

                    // Call displayCounts again only if the counts have actually changed
                    if (LOL.counts != oldLolCounts)
                    {
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
                    // Loop through all the processed posts and update lol counts
                    for (var i = 0; i < LOL.posts.length; i++)
                    {
                        LOL.showThreadCounts(LOL.posts[i]);
                    }
                }
            }

        }

        LOL.installLink();
        LOL.installCSS();
        processPostEvent.addHandler(LOL.installButtons);
        fullPostsCompletedEvent.addHandler(LOL.finishPosts);
    }
});
