// Twitter and Instagram embedding support (WombatFromHell)
settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("embed_socials")) {
        // dependency injection is required for twitter embedding
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.async = true;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);
            t._e = [];
            t.ready = function(f) {
                t._e.push(f);
            };
            return t;
        }(document, "script", "twttr-wjs"));
        // end dependency injection

        EmbedSocials = {
            getLinks: function(item) {
                // don't retrace our DOM nodes (use relative positions of event items)
                var links = item.querySelectorAll(".sel .postbody > a");
                for (var i = 0; i < links.length; i++) {
                    var parsedSocialPost = EmbedSocials.getSocialType(links[i].href);
                    if (parsedSocialPost != null) {
                        ((parsedSocialPost, i) => {
                            if (links[i].querySelector("div.expando")) { return; }
                            links[i].addEventListener("click", (e) => {
                                EmbedSocials.processPost(e, parsedSocialPost, i);
                            });

                            var _postBody = links[i].parentNode;
                            var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                            insertExpandoButton(links[i], _postId, i);
                        })(parsedSocialPost, i);
                    }
                }
            },

            getSocialType: function(href) {
                var _isTwitter = /https?\:\/\/(?:mobile\.|m\.)?twitter.com\/\w+\/status(?:es)?\/(\d+)/i;
                var _isInstagram = /https?\:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/p\/([\w\-]+)\/?/i;
                var _twttrMatch = _isTwitter.exec(href);
                var _instgrmMatch = _isInstagram.exec(href);
                if (_twttrMatch) {
                    return {
                        type: 1,
                        id: _twttrMatch[1]
                    };
                } else if (_instgrmMatch) {
                    return {
                        type: 2,
                        id: _instgrmMatch[1]
                    };
                }
                return null;
            },

            processPost: function(e, parsedPost, index) {
                if (e.button == 0) {
                    e.preventDefault();
                    if (!document.getElementById("twttr-wjs"))
                        return console.log("Embed Socials dependency injection failed!");

                    var socialType = parsedPost.type;
                    var socialId = parsedPost.id;
                    // adjust relative node position based on expando state
                    var _expandoClicked = e.target.classList !== undefined && e.target.classList.contains("expando");
                    var link = _expandoClicked ? e.target.parentNode : e.target;
                    var _postBody = link.parentNode;
                    var _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    // cancel early if we're toggling
                    if (toggleMediaItem(link, _postId, index)) { return; }

                    if (socialType === 1 && socialId) {
                        EmbedSocials.createTwitter(link, socialId, _postId, index);
                    } else if (socialType === 2 && socialId) {
                        EmbedSocials.parseInstagram(link, socialId, _postId, index);
                    }
                }
            },

            createTwitter: function(parentLink, socialId, postId, index) {
                var twttrContainer = document.createElement("div");
                var _target = `loader_${postId}-${index}`;
                twttrContainer.id = _target;
                twttrContainer.setAttribute("class", "tweet-container hidden");

                // twttr-wjs can just inject a tweet iframe straight into the DOM
                insertCommand(
                    twttrContainer, /*html*/`
                    window.twttr.widgets.createTweet(
                        "${socialId}",
                        document.getElementById("${_target}"), { theme: "dark" }
                    );
                `);
                mediaContainerInsert(twttrContainer, parentLink, postId, index);
            },

            getDate: function(timestamp) {
                var _date = new Date(0);
                _date.setUTCSeconds(timestamp);
                // we should have our relative local time now
                return `${_date.toLocaleString().split(',')[0]} ${_date.toLocaleTimeString('en-US')}`;
            },

            taggifyCaption: function(caption) {
                var captionContainer = document.createElement("span");
                captionContainer.id = "instgrm_post_caption";
                var tagLink = "https://instagr.am/explore/tags/";
                var userLink = "https://instagr.am/";
                // trim some potentially troublesome characters
                var _trimmed = caption.replace(/\\u00a0|[\.]{2,}/gmui, "").trim();
                var _sanitized = _trimmed.replace(/[\s]{1,}|[\n]/gm, " ").split(" ");
                for (var i=0; i < _sanitized.length; i++) {
                    var span = document.createElement("span");
                    if (_sanitized[i].indexOf("#") == 0) {
                        // transform hash tags into tag links
                        var link = document.createElement("a");
                        var _tag = _sanitized[i].replace("#", "");
                        link.href = `${tagLink}${_tag}/`;
                        span.innerText += `${_sanitized[i]}`;
                        link.appendChild(span);
                        captionContainer.appendChild(link);
                    } else if (_sanitized[i].indexOf("@") == 0) {
                        // transform user tags into user links
                        var link = document.createElement("a");
                        var _tag = _sanitized[i].replace("@", "");
                        link.href = `${userLink}${_tag}/`;
                        span.innerText += `${_sanitized[i]}`;
                        link.appendChild(span);
                        captionContainer.appendChild(link);
                    } else {
                        span.innerText += `${_sanitized[i]}`;
                        captionContainer.appendChild(span);
                    }
                }
                return captionContainer;
            },

            insertInstagramTemplate: function(postId, index) {
                var container = document.createElement("div");
                container.id = `instgrm-container_${postId}-${index}`;
                container.setAttribute("class", "instgrm-container hidden");
                // use a template for html injection
                safeInnerHTML(/*html*/`
                    <div class="instgrm-header">
                        <a href="#" id="instgrm_profile_a">
                            <img id="instgrm_author_pic" class="circle">
                        </a>
                        <div class="instgrm-postpic-line">
                            <a href="#" id="instgrm_profile_b">
                                <span id="instgrm_author_nick"></span>
                            </a>
                            <a href="#" id="instgrm_post_link">
                                <span id="instgrm_post_details"></span>
                            </a>
                        </div>
                        <div class="instgrm-logo">
                            <a href="http://www.instagram.com/">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                        </div>
                    </div>
                    <div id="instgrm_embed"></div>
                    <div id="instgrm-caption"></div>
                    <div class="instgrm-footer">
                        <span>A post shared by</span>
                        <a id="instgrm_post_url" href="#">
                            <span id="instgrm_postlink_name"></span>
                        </a>
                        <span id="instgrm_post_author"></span>
                        <span id="instgrm_post_timestamp"></span>
                    </div>
                `, container);
                var fragment = document.createDocumentFragment();
                fragment.appendChild(container);
                return fragment;
            },

            parseInstagram: function(parentLink, socialId, postId, index) {
                // start post parsing test list
                //var socialId = "BqiWTWbgPr_9PYvcOrz4xMrmfRPfxkKvCq-qc00"; // image
                //var socialId = "Bqgc_ILAHAh3nQztrir-X5S9_CpD3WLdRNyU5I0"; // multi-image
                //var socialId = "BrTUB4ehLjW"; // video
                //var socialId = "Bog2xW2HtAX"; // multi-video
                // end post parsing test list

                // use a CORS proxy to avoid CORB rule for this parsing step
                var postUrl = `https://cors.io/?https://www.instagram.com/p/${socialId}/`;
                // if we have an instagram postId use it to toggle our element rather than query
                var _target = parentLink.parentNode.querySelector(`#instgrm-container_${postId}-${index}`);
                if (_target) { return _target.classList.toggle("hidden"); }

                var _target = EmbedSocials.insertInstagramTemplate(postId, index);
                xhrRequest(postUrl).then(async res => {
                    var response = await res.text();
                    // save our likes from the header
                    var _likesMatch = /<meta content="([\d\,km]+ Likes, [\d\,km]+ Comments|[\d\,km]+ Likes,?|[\d\,km]+ Comments)/i.exec(response);
                    // parse post's graphql dump into a json object
                    var _configGQL = (() => {
                        // many things could go wrong so make sure to log errors
                        var _configGQL = /\:\{"PostPage":\[\{"graphql":(.*)\}\]\}/gm.exec(response);
                        try { return JSON.parse(_configGQL[1]); }
                        catch(err) { console.log(_configGQL, err); }
                    })();
                    var _matchGQL = _configGQL && _configGQL.shortcode_media;
                    // var _isPrivate = _matchGQL && _matchGQL.owner.is_private;

                    if (_matchGQL) {
                        var _authorPic = _matchGQL.owner.profile_pic_url;
                        var _authorName = _matchGQL.owner.username;
                        var _authorFullName = _matchGQL.owner.full_name;
                        var _postTimestamp = EmbedSocials.getDate(_matchGQL.taken_at_timestamp);
                        var _postURL = `https://instagr.am/p/${_matchGQL.shortcode}/`;
                        var _postCaption = _matchGQL.edge_media_to_caption;
                        var _postMediaUrls = EmbedSocials.collectInstgrmMedia(_matchGQL);
                        if (_postCaption && _postCaption.edges[0]) {
                            _postCaption = _matchGQL.edge_media_to_caption.edges[0].node.text;
                            var caption = _target.querySelector("#instgrm-caption");
                            caption.appendChild(EmbedSocials.taggifyCaption(_postCaption));
                        }

                        // populate our html elements
                        var postAuthorPic = _target.querySelector("#instgrm_author_pic");
                        var postAuthor = _target.querySelector("#instgrm_post_author");
                        var postPicAuthor = _target.querySelector("#instgrm_author_nick");
                        var postPicDetails = _target.querySelector("#instgrm_post_details");
                        var postLinkName = _target.querySelector("#instgrm_postlink_name");
                        var postTimestamp = _target.querySelector("#instgrm_post_timestamp");
                        var postParentUrl = _target.querySelector("#instgrm_post_url");
                        // set some relevant shortcuts in the header
                        var _profileLinkA = _target.querySelector("#instgrm_profile_a");
                        var _profileLinkB = _target.querySelector("#instgrm_profile_b");
                        var _postLink = _target.querySelector("#instgrm_post_link");
                        _profileLinkA.setAttribute("href", `https://instagr.am/${_authorName}/`);
                        _profileLinkB.setAttribute("href", `https://instagr.am/${_authorName}/`);
                        _postLink.setAttribute("href", `https://instagr.am/p/${postId}/`);

                        // fill in our user details
                        postAuthorPic.src = _authorPic;
                        postLinkName.innerText = _authorFullName;
                        postAuthor.innerText = `(@${_authorName})`;
                        postPicAuthor.innerText = _authorName;
                        postPicDetails.innerText = _likesMatch && _likesMatch[1];
                        postTimestamp.innerText = `on ${_postTimestamp}`;
                        postParentUrl.href = _postURL;

                        // compile everything into our container and inject at once
                        var embedTarget = _target.querySelector("#instgrm_embed");
                        var mediaContainer = appendMedia(_postMediaUrls, parentLink, postId, index, null, true);
                        mediaContainer.classList.add("instgrm-embed");
                        embedTarget.appendChild(mediaContainer);
                        mediaContainerInsert(_target, parentLink, postId, index);
                    } else { return alert("This account or post has been made private or cannot be found!"); }
                });
            },

            collectInstgrmMedia: function(parsedGQL) {
                var collector = [];
                if (parsedGQL.__typename === "GraphSidecar") {
                    parsedGQL.edge_sidecar_to_children.edges.forEach(edge => {
                        Object.entries(edge).forEach(item => {
                            // pick the video url of this item, or the smallest of the media choices (640x640)
                            collector.push(item[1].video_url != null ? item[1].video_url : item[1].display_resources[0].src);
                        })
                    });
                } else if (parsedGQL.__typename === "GraphVideo") {
                    collector.push(parsedGQL.video_url);
                } else if (parsedGQL.__typename === "GraphImage") {
                    collector.push(parsedGQL.display_resources[0].src);
                }
                return collector;
            },
        }
        processPostEvent.addHandler(EmbedSocials.getLinks);
    }
});
