/**
 * Created by wzutz on 12/9/13.
 */
settingsLoadedEvent.addHandler(function () {
    if (getSetting("enabled_scripts").contains("switchers")) {
        Switchers =
        {
            offenders: [
                {original: "MagicWishMonkey", new_name: "MaximDiscord", original_id: 160547 },
                {original: "thaperfectdrug", new_name: "Dave-A", original_id: 2650}
                {original: "timaste", new_name: "timmytaste", original_id: 172749}
            ],

            loadSwitchers: function (item) {
                for (var iOffender = 0; iOffender < Switchers.offenders.length; iOffender++)
                {
                    var offender = Switchers.offenders[iOffender];
                    var offenderPosts = getDescendentsByTagAndAnyClassName(item, "div", "olauthor_" + offender.original_id);
                    Switchers.rewritePosts(offenderPosts, offender);
                    offenderPosts = getDescendentsByTagAndAnyClassName(item, "div", "fpauthor_" + offender.original_id);
                    Switchers.rewritePosts(offenderPosts, offender);
                }
            },

            rewritePosts: function (offenderPosts, offender)
            {
                if(offenderPosts)
                {
                    for(var iPost = 0; iPost < offenderPosts.length; iPost++)
                    {
                        var post = offenderPosts[iPost];

                        var newName = offender.original + " - (" + offender.new_name + ")";
                        var span = getDescendentByTagAndClassName(post, "span", "oneline_user");
                        if(span) //For single line comments.
                        {
                            span.innerHTML = newName
                        }
                        else //For fully shown comments.
                        {
                            span = getDescendentByTagAndClassName(post, "span", "user");
                            if(span)
                            {
                                span.firstChild.innerHTML = newName;
                            }
                        }

                        //Switchers don't deserve lightning
                        var lightningbolt = getDescendentByTagAndClassName(post, "a", "lightningbolt");
                        if(lightningbolt)
                        {
                            $(lightningbolt).hide();
                        }
                    }
                }
            }
        }

        processPostEvent.addHandler(Switchers.loadSwitchers);
    }
});
