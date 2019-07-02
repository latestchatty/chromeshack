// Twitter and Instagram embedding support (WombatFromHell)
settingsLoadedEvent.addHandler(function() {
    if (objContains("embed_socials", getSetting("enabled_scripts"))) {
        EmbedSocials = {
            getLinks: function(item) {
                // don't retrace our DOM nodes (use relative positions of event items)
                let links = item.querySelectorAll(".sel .postbody > a");
                for (let i = 0; i < links.length; i++) {
                    let parsedSocialPost = EmbedSocials.getSocialType(links[i].href);
                    if (parsedSocialPost != null) {
                        ((parsedSocialPost, i) => {
                            if (links[i].querySelector("div.expando")) { return; }
                            links[i].addEventListener("click", (e) => {
                                EmbedSocials.processPost(e, parsedSocialPost, i);
                            });

                            let _postBody = links[i].parentNode;
                            let _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                            insertExpandoButton(links[i], _postId, i);
                        })(parsedSocialPost, i);
                    }
                }
            },

            getSocialType: function(href) {
                let _isTwitter = /https?\:\/\/(?:mobile\.|m\.)?twitter.com\/\w+\/status\/(\d+)/i;
                let _isInstagram = /https?\:\/\/(?:www\.|)(?:instagr.am|instagram.com)(?:\/.*|)\/p\/([\w\-]+)\/?/i;
                let _twttrMatch = _isTwitter.exec(href);
                let _instgrmMatch = _isInstagram.exec(href);
                if (_twttrMatch) {
                    return {
                        type: 1,
                        id: _twttrMatch && _twttrMatch[1]
                    };
                } else if (_instgrmMatch) {
                    return {
                        type: 2,
                        id: _instgrmMatch && _instgrmMatch[1]
                    };
                }
                return null;
            },

            processPost: function(e, parsedPost, index) {
                if (e.button == 0) {
                    e.preventDefault();
                    let socialType = parsedPost.type;
                    let socialId = parsedPost.id;
                    let userName = parsedPost.user;
                    // adjust relative node position based on expando state
                    let _expandoClicked = e.target.classList !== undefined && objContains("expando", e.target.classList);
                    let link = _expandoClicked ? e.target.parentNode : e.target;
                    let _postBody = link.parentNode;
                    let _postId = _postBody.parentNode.parentNode.id.replace(/item_/, "");
                    // cancel early if we're toggling
                    if (toggleMediaItem(link, _postId, index)) { return; }

                    if (socialType === 1 && socialId) {
                        EmbedSocials.createTweet(link, socialId, _postId, index);
                    } else if (socialType === 2 && socialId) {
                        EmbedSocials.parseInstagram(link, socialId, _postId, index);
                    }
                }
            },

            /*
                Twitter Implementation
            */
            createTweet: async function (parentLink, socialId, postId, index) {
                let _tweetObj = await EmbedSocials.fetchTweetData(socialId);
                let _tweetElem = EmbedSocials.renderTweet(parentLink, _tweetObj, postId, index);
                //console.log(_tweetObj, _tweetElem);
                mediaContainerInsert(_tweetElem, parentLink, postId, index);
            },

            fetchTweetData: async function (tweetId) {
                //let _link = "https://twitter.com/AOC/status/1143590995122171905";
                //let _link = "https://twitter.com/ieytd/status/1144334920493518848";
                //let _link = "https://twitter.com/NWSBoulder/status/1144670726173134848";
                let _link = "https://twitter.com/strongblacklead/status/1144652411602186241";
                //let _link = "https://twitter.com/Karckade/status/1144657968820080640";
                //let _link = "https://twitter.com/donoteat1/status/1145358207126257665";
                let linkMatch = /https?\:\/\/(?:mobile\.|m\.)?twitter.com\/\w+\/status\/(\d+)/i.exec(_link);
                tweetId = linkMatch && linkMatch[1];

                let _reqUrl = `https://api.twitter.com/1.1/statuses/show/${tweetId}.json?tweet_mode=extended`;
                let _token = "QUFBQUFBQUFBQUFBQUFBQUFBQUFBRGJiJTJGQUFBQUFBQVpQaURmd2VoMUtSMTdtTDdTRmVNTXpINEZLQSUzRFoxZ0ZXVmJxS2l6bjFweFZkcHFHSk85MW5uUVR3OVRFVHZrajRzcXZZcm9kcDc1OGo2";
                let _header = { headers: { "Authorization": `Bearer ${atob(_token) }` } };
                return new Promise(resolve => {
                    browser.runtime.sendMessage({ name: "corbFetch", url: _reqUrl, optionsObj: _header })
                    .then(tweetObj => {
                        // sanitized in common.js!
                        //console.log("From background: ", tweetObj);
                        let _response = {
                            tweetUrl: `https://twitter.com/${tweetObj.user.screen_name}/status/${tweetObj.id_str}`,
                            profilePic: tweetObj.user.profile_image_url_https,
                            profilePicUrl: `https://twitter.com/${tweetObj.user.screen_name}`,
                            displayName: tweetObj.user.name,
                            realName: tweetObj.user.screen_name,
                            tweetText: tagifyTweetText(tweetObj.full_text).outerHTML,
                            tweetMediaItems: !!tweetObj.extended_entities ? collectTweetMedia(tweetObj.extended_entities.media) : [],
                            tweetQuoted: (!!tweetObj.quoted_status && {
                                quotedUrl: tweetObj.quoted_status_permalink.expanded,
                                quotedDisplayName: tweetObj.quoted_status.user.name,
                                quotedRealName: tweetObj.quoted_status.user.screen_name,
                                quotedText: tagifyTweetText(tweetObj.quoted_status.full_text).outerHTML,
                                quotedMediaItems: !!tweetObj.quoted_status.extended_entities ? collectTweetMedia(tweetObj.quoted_status.extended_entities.media) : []
                            }) || {},
                            timestamp: new Date(Date.parse(tweetObj.created_at)).toLocaleString(),
                            userVerified: tweetObj.user.verified
                        };
                        return resolve(_response);
                    });
                });
                /* support funcs for tweetData object construction */
                function collectTweetMedia(tweetMediaObj) {
                    let result = [];
                    Object.values(tweetMediaObj).forEach(item => {
                        if (item.type === "video" && item.video_info.variants) {
                            for (let vidItem of item.video_info.variants) {
                                if (vidItem.content_type === "video/mp4") {
                                    let _vidDimensionsMatch = /vid\/(\d+)x(\d+)\//i.exec(vidItem.url);
                                    let _ratio = _vidDimensionsMatch ? (1 / (_vidDimensionsMatch[1] / _vidDimensionsMatch[2])) * 100 : 56.25;
                                    result.push({type: "video", url: vidItem.url, ratio: _ratio});
                                    break; // bail on the first match (highest res)
                                }
                            }
                        } else if (item.type === "photo" && item.media_url_https) {
                            result.push({type: "photo", url: item.media_url_https});
                        }
                    });
                    return result;
                }
                function tagifyTweetText(text) {
                    // try to parse our tags and text content into a DOM fragment
                    let postTextContentElem = document.createElement("span");
                    let hashReplacer = function(match, g1) {
                        let _match = g1.replace("#", "");
                        return `<a href="https://twitter.com/hashtag/${_match}?src=hash">#${_match}</a>`;
                    };
                    let atReplacer = function(match, g1) {
                        let _match = g1.replace("@", "");
                        return `<a href="https://twitter.com/${_match}">@${_match}</a>`;
                    };
                    let mediaReplacer = function(match, g1) {
                        return `<a class="twitter-embed-link" href="${g1}">${g1}</a>`;
                    };
                    let postTextTagified = text.replace(/#(\w+)/gm, hashReplacer);
                    postTextTagified = postTextTagified.replace(/@(\w+)/gm, atReplacer);
                    postTextTagified = postTextTagified.replace(/(https:\/\/t.co\/\w+)/gim, mediaReplacer);
                    postTextContentElem.innerHTML = postTextTagified;
                    return postTextContentElem;
                }
            },

            renderTweet: function (parentLink, tweetObj, postId, index) {
                let tweetTemplateElem = document.createElement("div");
                tweetTemplateElem.setAttribute("class", "twitter-container hidden");
                tweetTemplateElem.setAttribute("id", `loader_${postId}-${index}`);
                tweetTemplateElem.innerHTML = /*html*/`
                    <div class="twitter-header">
                        <a href="${tweetObj.profilePicUrl}" id="profile-pic-link">
                            <img id="user-profile-pic" src="${tweetObj.profilePic}" />
                        </a>
                        <div class="twitter-user-name">
                            <div>
                                <a href="${tweetObj.profilePicUrl}" id="twitter-displayname">${tweetObj.displayName}</a>
                                <svg version="1.1" id="twttr-verified" class="hidden" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 512 512" fill="#1DA1F2" xml:space="preserve"><path class="st0" d="M512,268c0,17.9-4.3,34.5-12.9,49.7c-8.6,15.2-20.1,27.1-34.6,35.4c0.4,2.7,0.6,6.9,0.6,12.6c0,27.1-9.1,50.1-27.1,69.1c-18.1,19.1-39.9,28.6-65.4,28.6c-11.4,0-22.3-2.1-32.6-6.3c-8,16.4-19.5,29.6-34.6,39.7C290.4,507,273.9,512,256,512c-18.3,0-34.9-4.9-49.7-14.9c-14.9-9.9-26.3-23.2-34.3-40c-10.3,4.2-21.1,6.3-32.6,6.3c-25.5,0-47.4-9.5-65.7-28.6c-18.3-19-27.4-42.1-27.4-69.1c0-3,0.4-7.2,1.1-12.6c-14.5-8.4-26-20.2-34.6-35.4C4.3,302.5,0,285.9,0,268c0-19,4.8-36.5,14.3-52.3c9.5-15.8,22.3-27.5,38.3-35.1c-4.2-11.4-6.3-22.9-6.3-34.3c0-27,9.1-50.1,27.4-69.1c18.3-19,40.2-28.6,65.7-28.6c11.4,0,22.3,2.1,32.6,6.3c8-16.4,19.5-29.6,34.6-39.7C221.6,5.1,238.1,0,256,0c17.9,0,34.4,5.1,49.4,15.1c15,10.1,26.6,23.3,34.6,39.7c10.3-4.2,21.1-6.3,32.6-6.3c25.5,0,47.3,9.5,65.4,28.6c18.1,19.1,27.1,42.1,27.1,69.1c0,12.6-1.9,24-5.7,34.3c16,7.6,28.8,19.3,38.3,35.1C507.2,231.5,512,249,512,268z M245.1,345.1l105.7-158.3c2.7-4.2,3.5-8.8,2.6-13.7c-1-4.9-3.5-8.8-7.7-11.4c-4.2-2.7-8.8-3.6-13.7-2.9c-5,0.8-9,3.2-12,7.4l-93.1,140L184,263.4c-3.8-3.8-8.2-5.6-13.1-5.4c-5,0.2-9.3,2-13.1,5.4c-3.4,3.4-5.1,7.7-5.1,12.9c0,5.1,1.7,9.4,5.1,12.9l58.9,58.9l2.9,2.3c3.4,2.3,6.9,3.4,10.3,3.4C236.6,353.7,241.7,350.9,245.1,345.1z"/></svg>
                            </div>
                            <span id="twitter-realname">@${tweetObj.realName}</span>
                        </div>
                        <a href="${tweetObj.tweetUrl}" id="twitter-badge">
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 33.88 33.88" fill="#1C9DEB" xml:space="preserve"><path d="M30.414,10.031c0.014,0.297,0.021,0.595,0.021,0.897c0,9.187-6.992,19.779-19.779,19.779c-3.928,0-7.58-1.149-10.657-3.123 c0.546,0.063,1.099,0.095,1.658,0.095c3.26,0,6.254-1.107,8.632-2.974c-3.039-0.058-5.607-2.065-6.491-4.828c0.424,0.082,0.858,0.125,1.308,0.125c0.635,0,1.248-0.084,1.83-0.244c-3.177-0.639-5.576-3.448-5.576-6.815 c0-0.029,0-0.058,0-0.087c0.939,0.521,2.01,0.833,3.15,0.869C2.646,12.48,1.419,10.35,1.419,7.938c0-1.274,0.343-2.467,0.94-3.495 c3.427,4.206,8.552,6.973,14.327,7.263c-0.117-0.509-0.18-1.038-0.18-1.584c0-3.838,3.112-6.949,6.953-6.949 c1.998,0,3.805,0.844,5.07,2.192c1.582-0.311,3.072-0.89,4.416-1.686c-0.521,1.624-1.621,2.986-3.057,3.844 c1.406-0.166,2.746-0.54,3.991-1.092C32.949,7.826,31.771,9.05,30.414,10.031z"/></svg>
                        </a>
                        </div>
                        <div class="twitter-content">
                            <div id="twitter-text-content">${tweetObj.tweetText}</div>
                            <div id="twitter-media-content" class="hidden"></div>
                            <div id="twitter-quote-content" class="hidden">
                                <div>
                                    <a href="${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedUrl : "#"}"
                                        id="twitter-quote-displayname"
                                    >
                                        ${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedDisplayName : ""}
                                    </a>
                                    <span id="twitter-quote-realname">
                                        @${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedRealName : ""}
                                    </span>
                                </div>
                                <div id="twitter-quote-text-content">
                                    ${tweetObj.tweetQuoted ? tweetObj.tweetQuoted.quotedText : ""}
                                </div>
                                <div id="twitter-quote-media-content" class="hidden"></div>
                            </div>
                        </div>
                        <div id="twitter-timestamp">${tweetObj.timestamp}</div>
                    </div>`;
                // compile media items into the "twitter-media-content" container
                let _compiledTemplate = EmbedSocials.compileTwitterMedia(parentLink, tweetTemplateElem, tweetObj, postId, index);
                // toggle visibility of our verified badge if data allows it
                if (tweetObj.userVerified)
                    _compiledTemplate.querySelector("#twttr-verified").classList.remove("hidden");
                return _compiledTemplate;
            },

            compileTwitterMedia: function(parentLink, templateElem, tweetObj, postId, index) {
                let mediaParent = templateElem.querySelector("#twitter-media-content");
                if (!!tweetObj.tweetMediaItems && tweetObj.tweetMediaItems.length > 0) {
                    // let appendMedia decide if a carousel is necessary and return an element
                    let mediaItems = parseMedia(tweetObj.tweetMediaItems);
                    let mediaContainer = appendMedia(mediaItems, parentLink, postId, index, null, true);
                    mediaParent.appendChild(mediaContainer);
                    mediaParent.classList.remove("hidden");
                } else if (!!tweetObj.tweetQuoted && Object.entries(tweetObj.tweetQuoted.quotedMediaItems).length > 0) {
                    // include media items inside quoted tweets (if available)
                    let mediaItems = parseMedia(tweetObj.tweetQuoted.quotedMediaItems);
                    templateElem.querySelector("#twitter-quote-content").classList.remove("hidden");
                    let quotedMediaParent = templateElem.querySelector("#twitter-quote-media-content");
                    let mediaContainer = appendMedia(mediaItems, parentLink, postId, index, null, true);
                    mediaParent.appendChild(mediaContainer);
                    mediaParent.classList.remove("hidden");
                    quotedMediaParent.classList.remove("hidden");
                } else if (!!tweetObj.tweetQuoted) {
                    templateElem.querySelector("#twitter-quote-content").classList.remove("hidden");
                }
                return templateElem;

                function parseMedia(mediaObjArr) {
                    let mediaArr = [];
                    mediaObjArr.forEach(item => {
                        mediaArr.push(item.url);
                    });
                    return mediaArr;
                }
            },

            /*
                Instagram implementation
            */
            createInstgrmTemplate: function(instgrmObj, postId, index) {
                let container = document.createElement("div");
                container.id = `instgrm-container_${postId}-${index}`;
                container.setAttribute("class", "instgrm-container hidden");
                // use a template for html injection
                if (instgrmObj) {
                    container.innerHTML = /*html*/`
                        <div class="instgrm-header">
                            <a href="https://instagr.am/${instgrmObj.authorName}/" id="instgrm_profile_a">
                                <img id="instgrm_author_pic" class="circle" src="${instgrmObj.authorPic}">
                            </a>
                            <div class="instgrm-postpic-line">
                                <a href="https://instagr.am/${instgrmObj.authorName}/" id="instgrm_profile_b">
                                    <span id="instgrm_author_nick">${instgrmObj.authorName}</span>
                                </a>
                                <a href="#" id="instgrm_post_link">
                                    <span id="instgrm_post_details">${instgrmObj.likes}</span>
                                </a>
                            </div>
                            <div class="instgrm-logo">
                                <a href="http://www.instagram.com/">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                </a>
                            </div>
                        </div>
                        <div id="instgrm_embed"></div>
                        <div id="instgrm-caption">${instgrmObj.postCaption}</div>
                        <div class="instgrm-footer">
                            <span>A post shared by</span>
                            <a id="instgrm_post_url" href="${instgrmObj.postUrl}">
                                <span id="instgrm_postlink_name">${instgrmObj.authorFullName}</span>
                            </a>
                            <span id="instgrm_post_author">(@${instgrmObj.authorName})</span>
                            <span id="instgrm_post_timestamp">on ${instgrmObj.postTimestamp}</span>
                        </div>
                    `;
                    let fragment = document.createDocumentFragment();
                    fragment.appendChild(container);
                    return fragment;
                }
                return null;
            },

            parseInstagram: function(parentLink, socialId, postId, index) {
                let postUrl = `https://www.instagram.com/p/${socialId}/`;
                // if we have an instagram postId use it to toggle our element rather than query
                let _target = parentLink.parentNode.querySelector(`#instgrm-container_${postId}-${index}`);
                if (_target) { return _target.classList.toggle("hidden"); }

                browser.runtime.sendMessage({ name: "corbFetch", url: postUrl, ovrBool: { instgrmBool: true } })
                .then(response => {
                    // sanitized in common.js!
                    let _matchGQL = response && response.gqlData.shortcode_media;
                    let _likes = response && response.likes;
                    // let _isPrivate = _matchGQL && _matchGQL.owner.is_private;
                    if (_matchGQL) {
                        let instgrmObj = {
                            likes: _likes,
                            authorPic: _matchGQL.owner.profile_pic_url,
                            authorName: _matchGQL.owner.username,
                            authorFullName: _matchGQL.owner.full_name,
                            postTimestamp: getDate(_matchGQL.taken_at_timestamp),
                            postUrl: `https://instagr.am/p/${_matchGQL.shortcode}/`,
                            postCaption: tagifyInstgrmContent(
                                !!_matchGQL.edge_media_to_caption.edges[0] ?
                                _matchGQL.edge_media_to_caption.edges[0].node.text :
                                _matchGQL.edge_media_to_caption
                            ).outerHTML
                        };
                        let _template = EmbedSocials.createInstgrmTemplate(instgrmObj, postId, index);
                        if (!!_template) {
                            // detected media also gets included in the template
                            let _postMediaUrls = collectInstgrmMedia(_matchGQL);
                            let embedTarget = _template.querySelector("#instgrm_embed");
                            let mediaContainer = appendMedia(_postMediaUrls, parentLink, postId, index, null, true);
                            mediaContainer.classList.add("instgrm-embed");
                            // compile everything into our template and append to DOM once
                            embedTarget.appendChild(mediaContainer);
                            mediaContainerInsert(_template, parentLink, postId, index);
                        } else {
                            throw Error(`Something went wrong when constructing Instagram template for: ${parentLink}`);
                        }
                    } else { return alert("This account or post has been made private or cannot be found!"); }
                });
                /* support funcs for Instagram element construction */
                function collectInstgrmMedia(parsedGQL) {
                    let collector = [];
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
                }
                function tagifyInstgrmContent(text) {
                    let captionContainer = document.createElement("span");
                    captionContainer.id = "instgrm_post_caption";
                    let hashReplacer = function(match, g1) {
                        let _match = g1.replace("#", "");
                        return `<a href="https://instagr.am/explore/tags/${_match}">#${_match}</a>`;
                    };
                    let atReplacer = function(match, g1) {
                        let _match = g1.replace("@", "");
                        return `<a href="https://instagr.am/${_match}">@${_match}</a>`;
                    };
                    let postTextTagified = text.replace(/#(\w+)/g, hashReplacer);
                    postTextTagified = postTextTagified.replace(/@(\w+)/g, atReplacer);
                    captionContainer.innerHTML = postTextTagified;
                    return captionContainer;
                }
                function getDate(timestamp) {
                    let _date = new Date(0);
                    _date.setUTCSeconds(timestamp);
                    // we should have our relative local time now
                    return `${_date.toLocaleString().split(',')[0]} ${_date.toLocaleTimeString()}`;
                }
            },
        }

        processPostEvent.addHandler(EmbedSocials.getLinks);
    }
});
