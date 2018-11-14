// Twitter and Instagram embedding support (WombatFromHell)
settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("embed_socials")) {
        // dependency injection is required
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
        (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
            t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.async = true;
            js.crossorigin = "anonymous";
            js.src = "https://platform.instagram.com/en_US/embeds.js";
            fjs.parentNode.insertBefore(js, fjs);
            t._e = [];
            t.ready = function(f) {
                t._e.push(f);
            };
            return t;
        }(document, "script", "instgrm-wjs"));
        // end dependency injection

        EmbedSocials = {
            getLinks: function(item, id) {
                var links = document.querySelectorAll("div.postbody a");
                if (links.length > 0) {
                    for (var i = 0; i < links.length; i++) {
                        if (EmbedSocials.isSocialLink(links[i].href))
                            links[i].addEventListener("click", EmbedSocials.processPost);
                    }
                }
            },

            isSocialLink: function(href) {
                var _isTwitter = /https?\:\/\/twitter.com\/\w+\/status\/(\d+)/i;
                var _isInstagram = /https?\:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/p\/([\w\-]+)\//i;
                if (_isTwitter.test(href)) { return true; }
                else if (_isInstagram.test(href)) { return true; }
                return false;
            },

            insertCommand: function(elem, customCode) {
                // insert a one-way script that executes synchronously (caution!)
                var _script = document.createElement("script");
                _script.textContent = `${customCode}`;
                return elem.appendChild(_script);
            },

            createTwitter: function(postUrl, postId, parentElem) {
                var twttrContainer = document.createElement("div");
                twttrContainer.id = `tweet-container_${postId}`;
                parentElem.appendChild(twttrContainer);
                var _target = `tweet-container_${postId}`;

                // twttr-wjs can just inject a tweet straight into the DOM
                EmbedSocials.insertCommand(
                    parentElem, /*html*/`
                    twttr.widgets.createTweet(
                        "${postId}",
                        document.getElementById("${_target}"),
                        { theme: "dark", width: "500" }
                    );
                `);

                if (getSetting("enabled_scripts").contains("scroll_to_post")) {
                    const smooth = getSetting('scroll_to_post_smooth', true);
                    scrollToElement(document.getElementById(_target), smooth ? 200 : 0);
                }
            },

            createInstagram: function(postId, parentElem) {
                var postUrl = `https://www.instagram.com/p/${postId}/`;
                var apiUrl = "https://www.instagram.com/publicapi/oembed/?omitscript=true&maxwidth=500&url=";
                var instgrmContainer = document.createElement("div");
                var _target = `instgrm-container_${postId}`;
                instgrmContainer.id = _target;

                xhrRequest({
                    type: "GET",
                    url: `${apiUrl}${postUrl}`
                }).then(data => {
                    var _data = JSON.parse(data).html;
                    instgrmContainer.replaceHTML(_data);
                    EmbedSocials.insertCommand(instgrmContainer, "instgrm.Embeds.process();");
                    // instgrm-wjs processing happens synchronously upon insertion of child
                    parentElem.appendChild(instgrmContainer);

                    if (getSetting("enabled_scripts").contains("scroll_to_post")) {
                        const smooth = getSetting('scroll_to_post_smooth', true);
                        scrollToElement(document.getElementById(_target), smooth ? 200 : 0);
                    }
                });
            },

            processPost: function(e) {
                if (e.button == 0) {
                    e.preventDefault();
                    if (!document.getElementById("twttr-wjs") || !document.getElementById("instgrm-wjs"))
                        return console.log("Embed Socials dependency injection failed!");

                    var link = this;
                    var _matchTwitter = /https?\:\/\/twitter.com\/\w+\/status\/(\d+)/i.exec(link.href);
                    var _matchInstagram = /https?\:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/p\/([\w\-]+)\//i.exec(link.href);
                    var _twitterPostId = _matchTwitter && _matchTwitter[1];
                    var _instgrmPostId = _matchInstagram && _matchInstagram[1];

                    var _targetTweet = document.querySelector(`div[id='tweet-container_${_twitterPostId}']`);
                    var _targetInstgrm = document.querySelector(`div[id='instgrm-container_${_instgrmPostId}']`);

                    if (_twitterPostId) {
                        if (_targetTweet)
                            return _targetTweet.classList.toggle("hidden");

                        EmbedSocials.createTwitter(_matchTwitter[0], _twitterPostId, link.parentNode);
                    }
                    else if (_instgrmPostId) {
                        if (_targetInstgrm)
                            return _targetInstgrm.classList.toggle("hidden");

                        EmbedSocials.createInstagram(_instgrmPostId, link.parentNode);
                    }
                }
            }
        }
        processPostEvent.addHandler(EmbedSocials.getLinks);
    }
});
