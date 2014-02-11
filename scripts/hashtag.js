Hashtag = 
{
    linkHash: function(match, p1, p2, offset, string) {
        return p1 + "<a href='/search?chatty=1&type=4&chatty_term=" + encodeURIComponent(p2) + "'>" + p2 + "</a>";
    },

    tagHashes: function(item, id) {
        var body = getDescendentByTagAndClassName(item, "div", "postbody");
        if (!body) {
            console.error("coudln't find post body for post id " + id);
            return;
        }

        var content = body.innerHTML;
        content = content.replace(/(^|\s|[^\w\d])(#\w+)/ig, Hashtag.linkHash);
        body.innerHTML = content;
    },

    install: function() {
        processPostEvent.addHandler(Hashtag.tagHashes);
    }
};

settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("hashtag")) {
        Hashtag.install();
    }
});
