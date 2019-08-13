let SparklyComic = {
    userMatch: null,

    installComic(item, id) {
        let fullpost = item.querySelector("div.fullpost");
        SparklyComic.userMatch = HighlightUsers.resolveUsers().filter(x => x.name === "sparkly")[0];
        // we have a fullpost, and its className contains sparkly's user id
        if (fullpost && SparklyComic.userMatch &&
            fullpost.classList.contains(`fpauthor_${SparklyComic.userMatch.id}`)) {
            let comic_id = `sparklycomic_${id}`;
            // comic is already here!
            if (document.getElementById(comic_id)) return;
            let postBody = fullpost.querySelector("div.postbody");
            let lines = SentenceParser.parseIntoLines(postBody.innerHTML);
            let comic_div = document.createElement("div");
            comic_div.id = comic_id;
            comic_div.className = "sparklycomic";
            postBody.appendChild(comic_div);
            let max = lines.length;
            for (let i = 0; i < max; i++) {
                let panel = document.createElement("div");
                panel.className = "panel";
                panel.style.backgroundImage = `url("${browser.runtime.getURL(
                    "../images/sparkly/" + SparklyComic.getImage(lines[i], i, max)
                )}")`;
                let s1 = document.createElement("span");
                s1.className = "shadow";
                safeInnerHTML(lines[i], s1);
                panel.appendChild(s1);
                let s2 = document.createElement("span");
                s2.className = "front";
                safeInnerHTML(lines[i], s2);
                panel.appendChild(s2);
                comic_div.appendChild(panel);
            }
        }
    },

    getImage(line, i, count) {
        // Let me show you my O face
        if (line.indexOf("!") >= 0 || line.indexOf(":o") >= 0) return "sparkly2.jpg";
        // Sparkly gets mad.  You wouldn't like him when he's mad.
        if (line.indexOf("&gt;:[") >= 0) return "sparkly5.jpg";
        // Sparkly gets sad.  You wouldn't like him when he's sad.
        if (line.indexOf(":(") >= 0 || line.indexOf(":[") >= 0) return "sparkly6.jpg";
        // Que?  wtf?
        if (line.indexOf("?") >= 0 || line.indexOf("wtf") >= 0) return "sparkly4.jpg";
        // LOL or NWS
        if (line.indexOf("lol") >= 0 || line.indexOf("nws") >= 0) return "sparkly3.jpg";
        if (line.indexOf(":/") >= 0) return "sparkly1.jpg";
        // end on a smile
        if (i == count - 1) return "sparkly3.jpg";
        // default sparkly
        return "sparkly1.jpg";
    }
};

addDeferredHandler(enabledContains("sparkly_comic"), res => {
    if (res) processPostEvent.addHandler(SparklyComic.installComic);
});
