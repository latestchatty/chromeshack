(function() {
    if(document.body.classList.contains('page-search')) {
        var searchResults = getDescendentByTagAndClassName(document, "ul", "results");
        var searchLinks = searchResults.getElementsByTagName("a");
        for(var i=0; i<searchLinks.length; i++) {
            var postId = searchLinks[i].href.match(/chatty\/(\d+)/i);
            if(postId && postId.length == 2) {
                searchLinks[i].href = 'http://www.shacknews.com/chatty?id=' + postId[1] + '#item_' + postId[1];
            }
        }
    }
    insertStyle(
        "body.page-search div#full-wrap div#main div.pagination { color: #666; }" +
        "body.page-search div#full-wrap div#main div.pagination a { color: #fff; }" +
        "body.page-search div#full-wrap div#main span.sort-results { color: #fff; }" +
        "body.page-search div#full-wrap div#main h2.search-num-found { color: #fff; }" +
        "body.page-search div#full-wrap div#main ul.results span.chatty-author a.more { color: #00f; }" +
        "body.page-search div#full-wrap div#main ul.results span.postdate { color: #aaa; }"
    );
})();