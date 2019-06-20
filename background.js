function getSettings()
{
    // work around chrome bug 161028
    var s = {};
    for (var key in localStorage)
        s[key] = localStorage[key];
    return s;
}

function getSetting(name, default_value)
{
    var value = localStorage[name];
    if (!value)
        return default_value;
    return JSON.parse(value);
}

function deleteSetting(name)
{
    for (var key in localStorage)
    {
        if (key == name) {
            localStorage.splice(key, 1);
        }
    }
}

function migrateSettings(version)
{
    if (version == 1.26)
    {
        var derp = getSetting('lol_ugh_threshhold', false);
        if (derp != false)
        {
            setSetting('lol_ugh_threshold', derp);
            deleteSetting('lol_ugh_threshhold');
        }
    }

    // add 'ugh' tag if not already added
    if (version == 1.25 || version == 1.26)
    {
        var tags = getSetting("lol_tags", false);
        if (tags != false)
        {
            var has_ugh = false;
            for (var i = 0; i < tags.length; i++)
                if (tags[i].name == 'ugh')
                    has_ugh = true;

            if (!has_ugh)
            {
                tags.push({name: "ugh", color: "#0b0"});
                setSetting('lol_tags', tags);
            }
        }
    }

    var current_version = browser.runtime.getManifest().version;
    if (version != current_version)
    {
        browser.tabs.create({url: "release_notes.html"});
    }

    setSetting("version", current_version);
}

function setSetting(name, value)
{
    localStorage[name] = JSON.stringify(value);
}

function showPageAction(tabId, url)
{
    browser.pageAction.setIcon({ "tabId": tabId, "path": "shack.png" });
    browser.pageAction.show(tabId);
}


function collapseThread(id)
{
    var MAX_LENGTH = 100;

    var collapsed = getSetting("collapsed_threads", []);

    if (collapsed.indexOf(id) < 0)
    {
        collapsed.unshift(id);

        // remove a bunch if it gets too big
        if (collapsed.length > MAX_LENGTH * 1.25)
            collapsed.splice(MAX_LENGTH);

        setSetting("collapsed_threads", collapsed);
    }
}

function unCollapseThread(id)
{
    var collapsed = getSetting("collapsed_threads", []);
    var index = collapsed.indexOf(id);
    if (index >= 0)
    {
        collapsed.splice(index, 1);
        setSetting("collapsed_threads", collapsed);
    }
}

function addContextMenus()
{
    // get rid of any old and busted context menus
    browser.contextMenus.removeAll();

    // add some basic context menus
    browser.contextMenus.create(
    {
        title: "Show comment history",
        contexts: [ 'link' ],
        onclick: showCommentHistoryClick,
        documentUrlPatterns: [ "https://*.shacknews.com/*" ],
        targetUrlPatterns: [ "https://*.shacknews.com/profile/*" ]
    });
}

function startNotifications()
{
    browser.notifications.onClicked.addListener(notificationClicked);
    pollNotifications();
}

function pollNotifications()
{
    var notificationuid = getSetting("notificationuid");
    //console.log("Notification UID is " + notificationuid);
    if (notificationuid != "" && notificationuid != undefined) {
        var _dataBody = `clientId=${notificationuid}`;
        postXHR("https://winchatty.com/v2/notifications/waitForNotification", _dataBody)
            .then(async response => {
                var notifications = await response.json();
                if(!notifications.error) {
                    //console.log("notification response text: " + res.responseText);
                    if (notifications.messages) {
                        for (var i = 0; i < notifications.messages.length; i++) {
                            var n = notifications.messages[i];
                            browser.notifications.create("ChromeshackNotification" + n.postId.toString(), {
                                type: "basic",
                                title: n.subject,
                                message: n.body,
                                iconUrl: "icon.png"
                            })
                        }
                    }
                    //If everything was successful, poll again in 15 seconds.
                    setTimeout(pollNotifications, 15000);
                    return;
                } else {
                    if(notifications.code === 'ERR_UNKNOWN_CLIENT_ID') {
                        browser.notifications.create("ErrorChromeshackNotification" , {
                            type: "basic",
                            title: "ChromeShack Error",
                            message: "Notifications are no longer enabled for this client, please try enabling them again.",
                            iconUrl: "icon.png"
                        });
                        setSetting('notificationuid', '');
                        setSetting('notifications', false);
                        return;
                    } else if (notifications.code == 'ERR_CLIENT_NOT_ASSOCIATED') {
                        browser.tabs.query({url: 'https://winchatty.com/v2/notifications/ui/login*'},
                            function(tabs){
                                // If they're not already logging in somewhere, they need to.  Otherwise we'll just leave it alone instead of bringing it to the front or anything annoying like that.
                                if(tabs.length === 0) {
                                browser.tabs.create({url: "https://winchatty.com/v2/notifications/ui/login?clientId=" + notificationuid});
                                }
                            });
                    }
                }
                setTimeout(pollNotifications, 60000);
            }).catch(err => {
                console.log(err);
                setTimeout(pollNotifications, 60000);
            });
    }
}

function notificationClicked(notificationId) {
    if(notificationId.indexOf("ChromeshackNotification") > -1) {
        var postId = notificationId.replace("ChromeshackNotification", "");
        var url = "https://www.shacknews.com/chatty?id=" + postId + "#item_" + postId;
        browser.tabs.create({url: url});
        browser.notifications.clear(notificationId);
    }
}

function showCommentHistoryClick(info, tab)
{
    var match = /\/profile\/(.+)$/.exec(info.linkUrl);
    if (match)
    {
        var search_url = "https://winchatty.com/search?author=" + escape(match[1]);
        browser.tabs.create({windowId: tab.windowId, index: tab.index + 1, url: search_url});
    }
}

browser.runtime.onMessage.addListener(function(request, sender)
{
    if (request.name == "getSettings")
    {
        var tab = sender.tab;
        if (tab)
            showPageAction(tab.id, tab.url);
        return Promise.resolve(getSettings());
    }
    else if (request.name === "setSetting")
        return Promise.resolve(setSetting(request.key, request.value));
    else if (request.name === "collapseThread")
        return Promise.resolve(collapseThread(request.id));
    else if (request.name === "unCollapseThread")
        return Promise.resolve(unCollapseThread(request.id));
    else if (request.name === "launchIncognito")
        return Promise.resolve(browser.windows.create({ url: request.value, incognito: true }));
    else if (request.name === "allowedIncognitoAccess") {
        return Promise.resolve(browser.extension.isAllowedIncognitoAccess());
    }
    else if (request.name === "chatViewFix") {
        // inject CVF monkey patch once upon page load to fix scroll bugs
        browser.tabs.executeScript(null, { code: `window.monkeyPatchCVF === undefined` })
        .then(res => { if (res) { browser.tabs.executeScript({ code: `
            function clickItem(b, f) {
                var d = window.frames.dom_iframe;
                var e = d.document.getElementById("item_" + f);
                if (uncap_thread(b)) {
                    elem_position = $("#item_" + f).position();
                    scrollToItem($("li#item_" + f).get(0));
                }
                sLastClickedItem = f;
                sLastClickedRoot = b;
                if (d.document.getElementById("items_complete") && e) {
                    var c = find_element(e, "DIV", "fullpost");
                    var a = import_node(document, c);
                    show_item_fullpost(b, f, a);
                    return false
                } else {
                    path_pieces = document.location.pathname.split("?");
                    parent_url = path_pieces[0];
                    navigate_page_no_history(d, "/frame_chatty.x?root=" + b + "&id=" + f + "&parent_url=" + parent_url);
                    return false
                }
            }

            function show_item_fullpost(f, h, b) {
                remove_old_fullpost(f, h, parent.document);
                var k = parent.document.getElementById("root_" + f);
                var e = parent.document.getElementById("item_" + h);
                push_front_element(e, b);
                scrollToItem(e);
                e.className = add_to_className(e.className, "sel");
                var c = find_element(e, "DIV", "oneline");
                c.className = add_to_className(c.className, "hidden")
            }

            function scrollToItem(b) {
                if (!elementIsVisible(b)) {
                    scrollToElement(b);
                }
            }
            var chatViewFixElem = document.createElement("script");
            chatViewFixElem.id = "chatviewfix-wjs";
            chatViewFixElem.textContent = \`\$\{clickItem.toString()\}\$\{show_item_fullpost.toString()\}\$\{scrollToItem.toString()\}\$\{scrollToElement.toString()\}\$\{elementIsVisible.toString()\}\`;
            var bodyRef = document.getElementsByTagName("body")[0];
            bodyRef.appendChild(chatViewFixElem);
            undefined;` }); } });
    }
    else if (request.name === "lightbox") {
        let commonCode = `
            var lightbox = window.basicLightbox.create('${request.elemText}');
            lightbox.show();
        `;
        browser.tabs.executeScript(null, { code: `window.basicLightbox === undefined` })
        .then((res) => {
            if (res) {
                browser.tabs.executeScript(null, { file: "ext/basiclightbox/basicLightbox-5.0.2.min.js" }).then(() => {
                    browser.tabs.executeScript(null, { code: `${commonCode}` });
                });
            } else {
                browser.tabs.executeScript(null, { code: `${commonCode}` });
            }
        });
    }
    else if (request.name === "injectCarousel") {
        let commonCode = `
            var container = document.querySelector("${request.select}");
            var carouselOpts = {
                autoHeight: true,
                centeredSlides: true,
                slidesPerView: 'auto',
                navigation: {
                  nextEl: '.swiper-button-next',
                  prevEl: '.swiper-button-prev',
                },
                on: {
                    init: function() {
                        var swiperEl = this;
                        var wrapper = container.querySelector(".swiper-wrapper");
                        var mediaSlideFirstIndex = function(elem) {
                            var iter = Array.from(elem.children);
                            for (var i=0; i<iter.length-1; i++) {
                                if (iter[i].nodeName === "VIDEO")
                                    return i;
                            }
                            return -1;
                        };

                        // if video is first then recalc the carousel height once loaded
                        var firstSlide = wrapper.children[0];
                        if (firstSlide.nodeName === "VIDEO") {
                            firstSlide.addEventListener("loadedmetadata", function() {
                                swiperEl.update();
                            });
                        }
                        // autoplay only if video is the first slide
                        var videoSlideIndex = mediaSlideFirstIndex(wrapper);
                        if (swiperEl.realIndex === videoSlideIndex)
                            wrapper.children[videoSlideIndex].play();
                    },
                    transitionEnd: function() {
                        // toggle autoplay on slides as we transition to/from them
                        var slides = container.querySelectorAll('video');
                        slides.forEach(function(x) {
                            if (x.className.indexOf("swiper-slide-active") > -1) {
                                x.play();
                                x.muted = false;
                            }
                            else {
                                x.muted = true;
                                x.pause();
                            }
                        });
                    }
                }
            };
            carouselOpts.autoHeight = false;
            var swiper = new Swiper(container, carouselOpts);
        `;
        browser.tabs.executeScript(null, { code: `window.Swiper === undefined` })
        .then((res) => {
            if (res) {
                browser.tabs.executeScript(null, { file: "ext/swiper/swiper-4.5.0.min.js" }).then(() => {
                    browser.tabs.executeScript(null, { code: `${commonCode}` });
                });
            } else {
                browser.tabs.executeScript(null, { code: `${commonCode}` });
            }
        });
    }
    else if (request.name === "refreshPostByClick") {
        browser.tabs.executeScript(null, { code: `
            function chat_onkeypress(b) {
                if (!b) {
                    b = window.event;
                }
                var a = String.fromCharCode(b.keyCode);
                if (sLastClickedItem != -1 && sLastClickedRoot != -1 && check_event_target(b)) {
                    if (a == "Z") {
                        id = get_item_number_from_item_string(get_next_item_for_root(sLastClickedRoot, sLastClickedItem));
                        if (id != false) {
                            clickItem(sLastClickedRoot, id);
                            var elem = document.querySelector(\`li#item_\$\{id\} span.oneline_body\`);
                            elem.click();
                        }
                    }
                    if (a == "A") {
                        id = get_item_number_from_item_string(get_prior_item_for_root(sLastClickedRoot, sLastClickedItem));
                        if (id != false) {
                            clickItem(sLastClickedRoot, id);
                            var elem = document.querySelector(\`li#item_\$\{id\} span.oneline_body\`);
                            elem.click();
                        }
                    }
                }
                return true;
            }

            var refreshPostFixElem = document.createElement("script");
            refreshPostFixElem.id = "refreshpostfix-wjs";
            refreshPostFixElem.textContent = \`\$\{chat_onkeypress.toString()\}\`;
            var bodyRef = document.getElementsByTagName("body")[0];
            bodyRef.appendChild(refreshPostFixElem);
            undefined;`});
    }
    else if (request.name === "oEmbedRequest")
        return xhrRequest(request.url).then(response => {
            var data = response.json();
            return Promise.resolve(data);
        }
        ).catch(err => console.log(err));

    return Promise.resolve();
});

addContextMenus();

// attempt to update version settings
var last_version = getSetting("version", 0);
migrateSettings(last_version);

startNotifications();
