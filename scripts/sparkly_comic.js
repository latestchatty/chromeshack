if (getSetting("enabled_scripts").contains("sparkly_comic"))
{
    SparklyComic =
    {

        installComic: function(item, id)
        {
            var fullpost = getDescendentByTagAndClassName(item, "div", "fullpost");

            // we have a fullpost, and its className contains sparkly's user id
            if (fullpost && fullpost.className.indexOf("fpauthor_170040") >= 0)
            {
                var comic_id = "sparklycomic_" + id;

                // comic is already here!
                if (document.getElementById(comic_id))
                    return;

                var postBody = getDescendentByTagAndClassName(fullpost, "div", "postbody");
                var lines = DinoGegtik.parsePostIntoLines(postBody.innerHTML);

                var comic_div = document.createElement("div");
                comic_div.id = comic_id;
                comic_div.className = "sparklycomic";

                postBody.appendChild(comic_div);

                var max = lines.length;
                for (var i = 0; i < max; i++)
                {
                    var panel = document.createElement("div");
                    panel.className = "panel";
                    panel.style.backgroundImage = "url(" + chrome.extension.getURL("../images/sparkly/" + SparklyComic.getImage(lines[i], i, max)) + ")";

                    var s1 = document.createElement("span");
                    s1.className = "shadow";
                    s1.innerHTML = lines[i];
                    panel.appendChild(s1);

                    var s2 = document.createElement("span");
                    s2.className = "front";
                    s2.innerHTML = lines[i];
                    panel.appendChild(s2);

                    comic_div.appendChild(panel);
                }
            }
        },

        getImage: function(line, i, count)
        {
            // Let me show you my O face 
            if (line.indexOf('!') >= 0 || line.indexOf(":o") >= 0)
                return "sparkly2.jpg";

            // Sparkly gets mad.  You wouldn't like him when he's mad.   
            if (line.indexOf('&gt;:[') >= 0)
                return "sparkly5.jpg";

            // Sparkly gets sad.  You wouldn't like him when he's sad.   
            if (line.indexOf(':(') >= 0 || line.indexOf(':[') >= 0)
                return "sparkly6.jpg";

            // Que?  wtf?
            if (line.indexOf('?') >= 0 || line.indexOf("wtf") >= 0)
                return "sparkly4.jpg";

            // LOL or NWS
            if (line.indexOf('lol') >= 0 || line.indexOf('nws') >= 0)
                return "sparkly3.jpg";

            if (line.indexOf(':/') >= 0)
                return "sparkly1.jpg";

            // end on a smile
            if (i == (count - 1))
                return "sparkly3.jpg";

            // default sparkly
            return "sparkly1.jpg";
        },

        parsePostIntoLines: function(html)
        {
            var res = new Array(); 

            var LINK_PLACEHOLDER = "%%link%%";
            var SPOILER_PLACEHOLDER = "%%spoiler%%";
        
            // Extract all the links, store them in links[] and replace the link with a %%link%% placeholder in the post 
            var links = new Array(); 
            var link_regex = new RegExp(/<a.*? href=(\"|')(.*?)([\n|\r]*?)(\"|').*?>(.*?)([\n|\r]*?)<\/a>/i);
            var m = link_regex.exec(html);
            while (m)
            {
                // save the link, and put a placeholder in
                links.push(m[0]);
                html = html.replace(link_regex, LINK_PLACEHOLDER);
                m = link_regex.exec(html);
            }

            var spoilers = new Array(); 
            var spoiler_regex = new RegExp(/<a.*? href=(\"|')(.*?)([\n|\r]*?)(\"|').*?>(.*?)([\n|\r]*?)<\/a>/i);
            m = spoiler_regex.exec(html);
            while (m)
            {
                // save the link, and put a placeholder in
                spoilers.push(m[0]);
                html = html.replace(spoiler_regex, SPOILER_PLACEHOLDER);
                m = spoiler_regex.exec(html);
            }
        
            // remove the rest of the html from the post
            post = stripHtml(html);

            var link_replace_regex = new RegExp(LINK_PLACEHOLDER, "i");
            var spoiler_replace_regex = new RegExp(SPOILER_PLACEHOLDER, "i");

            // Split paragraphs
            var lines = post.split('\n');
            
            // Get sentences from paragraphs
            for (var i = 0; i < lines.length; i++)
            {
                lines[i] = lines[i].replace('...', '&ellipsis;'); 
        
                var sentences = lines[i].split('.');
                
                for (var j = 0; j < sentences.length; j++)
                {
                    if (sentences[j].length)
                    {
                        var tmp = sentences[j];
                        tmp = tmp.replace('&ellipsis;', '...'); 
        
                        // replace placeholders with actual links
                        while (tmp.indexOf(LINK_PLACEHOLDER) >= 0)
                        {
                            tmp = tmp.replace(link_replace_regex, links.shift());
                        }

                        while (tmp.indexOf(SPOILER_PLACEHOLDER) >= 0)
                        {
                            tmp = tmp.replace(spoiler_replace_regex, spoilers.shift());
                        }
        
                        res.push(tmp);
                    }
                }
            }

            return res; 
        }

    }

    processPostEvent.addHandler(SparklyComic.installComic);
}
